import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveProfiles } from '@/utils/getActiveUsers';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'workspace_admin' | 'admin' | 'sdr' | 'closer' | 'designer' | 'copywriter' | 'analista_performance' | 'gestor_projeto';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  custom_role_id?: string;
  selected_celebration_id?: string;
  project_scope?: 'crm' | 'cs' | 'both';
  squad?: string;
  custom_roles?: {
    base_role: string;
    display_name?: string;
  };
  effectiveRole?: string;
  customRoleDisplayName?: string;
}

interface AuthContextType {
  user: any;
  session: any;
  profile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  signOut: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'workspace_admin' | 'admin' | 'sdr' | 'closer' | 'designer' | 'copywriter' | 'analista_performance' | 'gestor_projeto';
    department?: string;
    phone?: string;
    customRoleId?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateUser: (userId: string, userData: Partial<Profile>) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  activateUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Inline auth user (no longer depends on mockData) ──
const AUTH_USER = {
  id: 'auth-mock-001',
  email: 'admin@dotconceito.com',
  app_metadata: {},
  user_metadata: { full_name: 'Admin DOT' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const ADMIN_PROFILE: Profile = {
  id: 'profile-001',
  user_id: AUTH_USER.id,
  name: 'Admin DOT',
  email: 'admin@dotconceito.com',
  role: 'admin',
  is_active: true,
  project_scope: 'both',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  department: 'Gestão',
  phone: '(11) 99999-0001',
  effectiveRole: 'admin',
};

const DEFAULT_PROFILES: Profile[] = [
  ADMIN_PROFILE,
  {
    id: 'profile-002', user_id: 'auth-mock-002', name: 'Vinícius Cadó', email: 'vinicius.cado@dotconceito.com',
    role: 'admin', is_active: true, project_scope: 'both', created_at: '2024-02-01T00:00:00Z',
    updated_at: new Date().toISOString(), department: 'Gestão', effectiveRole: 'admin',
  },
  {
    id: 'profile-004', user_id: 'des-001', name: 'Matheus Alves', email: 'matheus.silva@dotconceito.com',
    role: 'designer', is_active: true, project_scope: 'both', created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(), department: 'Criação', squad: 'Apollo', effectiveRole: 'designer',
  },
  {
    id: 'profile-005', user_id: 'des-002', name: 'Sofia Rondon', email: 'sofia.rondon@dotconceito.com',
    role: 'designer', is_active: true, project_scope: 'both', created_at: '2024-01-20T00:00:00Z',
    updated_at: new Date().toISOString(), department: 'Criação', squad: 'Athena', effectiveRole: 'designer',
  },
  {
    id: 'profile-006', user_id: 'des-003', name: 'Iris Castro', email: 'iris.castro@dotconceito.com',
    role: 'designer', is_active: true, project_scope: 'both', created_at: '2024-02-10T00:00:00Z',
    updated_at: new Date().toISOString(), department: 'Criação', effectiveRole: 'designer',
  },
  {
    id: 'profile-007', user_id: 'cop-001', name: 'Elias Zappelini', email: 'elias.zappelini@dotconceito.com',
    role: 'copywriter', is_active: true, project_scope: 'both', created_at: '2024-01-18T00:00:00Z',
    updated_at: new Date().toISOString(), department: 'Criação', effectiveRole: 'copywriter',
  },
  {
    id: 'profile-008', user_id: 'cop-002', name: 'Eduardo Schefer', email: 'eduardo.schefer@dotconceito.com',
    role: 'copywriter', is_active: true, project_scope: 'both', created_at: '2024-02-05T00:00:00Z',
    updated_at: new Date().toISOString(), department: 'Criação', effectiveRole: 'copywriter',
  },
];

const PROFILES_STORAGE_KEY = 'dot_profiles_v4';

function loadPersistedProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Profile[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  localStorage.removeItem('dot_profiles_v1');
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
  return DEFAULT_PROFILES;
}

function persistProfiles(profiles: Profile[]) {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(ADMIN_PROFILE);
  const [profiles, setProfilesState] = useState<Profile[]>(() => loadPersistedProfiles());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return sessionStorage.getItem('dot_authenticated') === 'true'; } catch { return false; }
  });

  const setProfiles = (updater: Profile[] | ((prev: Profile[]) => Profile[])) => {
    setProfilesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistProfiles(next);
      return next;
    });
  };

  useEffect(() => {
    setActiveProfiles(profiles as any);
  }, [profiles]);

  const login = (email: string, password: string): boolean => {
    const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase() && p.is_active);
    if (found && password === 'dot2024') {
      setProfile(found);
      setIsAuthenticated(true);
      try { sessionStorage.setItem('dot_authenticated', 'true'); } catch {}
      return true;
    }
    return false;
  };

  const value: AuthContextType = {
    user: isAuthenticated ? AUTH_USER : null,
    session: isAuthenticated ? { access_token: 'mock', user: AUTH_USER } : null,
    profile: isAuthenticated ? profile : null,
    profiles,
    loading: false,
    isAuthenticated,
    login,
    signOut: async () => {
      setIsAuthenticated(false);
      try { sessionStorage.removeItem('dot_authenticated'); } catch {}
    },
    refreshProfiles: async () => {},
    refreshProfile: async () => {},
    addUser: async (userData) => {
      const newProfile: Profile = {
        id: 'mock-' + Date.now(),
        user_id: 'mock-' + Date.now(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: true,
        department: userData.department || undefined,
        phone: userData.phone || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfiles(prev => [...prev, newProfile]);
      return { success: true, message: 'User created' };
    },
    updateUser: async (userId, userData) => {
      setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, ...userData } : p));
      return true;
    },
    removeUser: async (userId) => {
      setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, is_active: false } : p));
      return true;
    },
    activateUser: async (userId) => {
      setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, is_active: true } : p));
      return true;
    },
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
