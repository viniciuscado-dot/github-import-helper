import { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { CommandPalette } from "@/components/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useInterfacePreferences, ViewType } from "@/hooks/useInterfacePreferences";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";

import { toast } from "sonner";
import { UserManagement } from "@/components/UserManagement";
import { TopBar } from "@/components/TopBar";
import { UserProfile } from "@/components/UserProfile";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { CopyForm } from "@/components/CopyForm";
import { AnaliseBench } from "@/components/AnaliseBench";
import { HomeCriacao } from "@/components/HomeCriacao";
import { InterfacePreferences } from "@/components/InterfacePreferences";
import { TestCopyBriefingForm } from "@/components/TestCopyBriefingForm";

type ActiveViewType = 'home-criacao' | 'users' | 'profile' | 'copy' | 'aprovacao' | 'analise-bench' | 'preferencias-interface' | 'teste-copy';

const VALID_VIEWS: ActiveViewType[] = ['home-criacao', 'users', 'profile', 'copy', 'aprovacao', 'analise-bench', 'preferencias-interface', 'teste-copy'];

const Index = () => {
  const { profile, signOut } = useAuth();
  const { checkModulePermission, loading: permissionsLoading } = useModulePermissions();
  const { preferences } = useInterfacePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const getInitialView = (): ActiveViewType => {
    const viewFromUrl = searchParams.get('view') as ActiveViewType;
    if (viewFromUrl && VALID_VIEWS.includes(viewFromUrl)) {
      return viewFromUrl;
    }
    return 'home-criacao';
  };

  const [activeView, setActiveViewState] = useState<ActiveViewType>(getInitialView);

  const setActiveView = (view: ActiveViewType) => {
    setActiveViewState(view);
    setSearchParams({ view });
  };

  useEffect(() => {
    const viewFromUrl = searchParams.get('view') as ActiveViewType;
    if (viewFromUrl && VALID_VIEWS.includes(viewFromUrl) && viewFromUrl !== activeView) {
      setActiveViewState(viewFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.state?.view) {
      setActiveView(location.state.view);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useKeyboardShortcuts(
    preferences.keyboardShortcutsEnabled,
    () => setCommandPaletteOpen(true),
    (view) => setActiveView(view as any)
  );

  useEffect(() => {
    const viewFromUrl = searchParams.get('view') as ActiveViewType | null;
    const hasValidViewInUrl = !!(viewFromUrl && VALID_VIEWS.includes(viewFromUrl));

    if (!profile) return;

    if (profile.effectiveRole !== 'admin' && viewFromUrl === 'users') {
      setActiveView('home-criacao');
      return;
    }

    if (profile.effectiveRole !== 'admin' && permissionsLoading) {
      return;
    }

    if (profile.effectiveRole !== 'admin' && !hasValidViewInUrl) {
      setActiveView('home-criacao');
    }
  }, [profile, permissionsLoading, searchParams, checkModulePermission]);

  const handleViewChange = (newView: any) => {
    if (newView === 'aprovacao') {
      navigate('/aprovacao');
      return;
    }
    
    const moduleMap = {
      'home-criacao': 'copy',
      'users': 'users',
      'profile': 'profile',
      'copy': 'copy',
      'aprovacao': 'aprovacao',
      'analise-bench': 'analise_bench',
      'preferencias-interface': 'profile',
      'teste-copy': 'copy',
    } as const;
    
    const moduleName = moduleMap[newView as keyof typeof moduleMap];
    
    if (profile?.effectiveRole === 'admin' || (moduleName && checkModulePermission(moduleName, 'view'))) {
      setActiveView(newView);
    } else if (permissionsLoading) {
      setActiveView(newView);
    } else {
      toast("Acesso negado", {
        description: "Você não tem permissão para acessar este módulo.",
        position: "top-center",
      });
    }
  };

  const renderContent = () => {
    const moduleMap = {
      'home-criacao': 'copy',
      'users': 'users', 
      'profile': 'profile',
      'copy': 'copy',
      'aprovacao': 'aprovacao',
      'analise-bench': 'analise_bench',
      'preferencias-interface': 'preferencias-interface',
      'teste-copy': 'copy',
    };
    
    const currentModule = moduleMap[activeView as keyof typeof moduleMap];
    
    if (profile?.effectiveRole !== 'admin' && permissionsLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
      );
    }
    
    if (activeView !== 'home-criacao' && profile?.effectiveRole !== 'admin' && !checkModulePermission(currentModule, 'view')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-muted-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar este módulo. Entre em contato com o administrador se precisar de acesso.
          </p>
          <button 
            onClick={() => setActiveView('home-criacao')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Ir para módulo disponível
          </button>
        </div>
      );
    }

    switch (activeView) {
      case 'home-criacao':
        return <HomeCriacao onNavigate={handleViewChange} />
      case 'copy':
        const clientParam = searchParams.get('client') || undefined;
        return <CopyForm clientName={clientParam} />
      case 'teste-copy':
        const testClientParam = searchParams.get('client') || undefined;
        return <TestCopyBriefingForm clientName={testClientParam} />
      case 'analise-bench':
        return <AnaliseBench />
      case 'users':
        return <UserManagement />
      case 'profile':
        return <UserProfile />
      case 'preferencias-interface':
        return <InterfacePreferences />
      default:
        return <CopyForm />
    }
  }

  return (
    <>
      <CommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleViewChange}
      />
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
          <AppSidebar 
            activeView={activeView as any}
            onViewChange={handleViewChange}
          />
          <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
            <MobileSidebarTrigger />
            <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
              <TopBar />
              <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
                {renderContent()}
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
