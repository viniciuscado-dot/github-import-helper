import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/external-client';
import type { Session, User } from '@supabase/supabase-js';
import { setActiveProfiles } from '@/utils/getActiveUsers';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'workspace_admin' | 'admin' | 'equipe';
  group_name?: string;
  squad?: string;
  avatar_url?: string;
  is_active: boolean;
  project_scope?: string;
  custom_role_id?: string;
  selected_celebration_id?: string;
  created_at: string;
  updated_at: string;
  // Compatibility fields used by existing UI
  user_id?: string;
  effectiveRole?: string;
  customRoleDisplayName?: string;
  custom_roles?: { base_role: string; display_name?: string };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'workspace_admin' | 'admin' | 'equipe';
    department?: string;
    phone?: string;
    group_name?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateUser: (userId: string, userData: Partial<Profile>) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  activateUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function enrichProfile(p: any): Profile {
  return {
    ...p,
    user_id: p.id, // compatibility: many components use user_id
    effectiveRole: p.role,
    email: p.email || '',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      const enriched = enrichProfile(data);
      setProfile(enriched);
      return enriched;
    }
    return null;
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    if (!error && data) {
      const enriched = data.map(enrichProfile);
      setProfiles(enriched);
      setActiveProfiles(enriched as any);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            await fetchProfile(newSession.user.id);
            await fetchProfiles();
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setProfiles([]);
          setLoading(false);
        }
      }
    );

    // Then get existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(() => {
          fetchProfiles().then(() => setLoading(false));
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchProfiles]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      return false;
    }
    return true;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setProfiles([]);
  };

  const addUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'workspace_admin' | 'admin' | 'equipe';
    department?: string;
    phone?: string;
    group_name?: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      // Call edge function to create user (uses service_role)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return { success: false, error: 'Não autenticado' };

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          profile: {
            name: userData.name,
            role: userData.role,
            department: userData.department || null,
            phone: userData.phone || null,
            group_name: userData.group_name || null,
          },
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message || 'Erro ao criar usuário' };
      }

      const body = response.data;
      if (body?.error === 'EMAIL_ALREADY_EXISTS') {
        return { success: false, error: 'Este email já está cadastrado no sistema' };
      }
      if (body?.error) {
        return { success: false, error: body.error };
      }

      await fetchProfiles();
      return { success: true, message: 'Usuário criado com sucesso' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado' };
    }
  };

  const updateUser = async (userId: string, userData: Partial<Profile>): Promise<boolean> => {
    // Filter only allowed fields
    const { name, phone, department, group_name, squad, avatar_url, role, is_active } = userData as any;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (group_name !== undefined) updates.group_name = group_name;
    if (squad !== undefined) updates.squad = squad;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Update user error:', error);
      return false;
    }

    await fetchProfiles();
    if (userId === user?.id) await fetchProfile(userId);
    return true;
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId);
    if (error) return false;
    await fetchProfiles();
    return true;
  };

  const activateUser = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', userId);
    if (error) return false;
    await fetchProfiles();
    return true;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    profiles,
    loading,
    isAuthenticated: !!session && !!user,
    login,
    signOut: handleSignOut,
    refreshProfiles: fetchProfiles,
    refreshProfile: async () => { if (user) await fetchProfile(user.id); },
    addUser,
    updateUser,
    removeUser,
    activateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
