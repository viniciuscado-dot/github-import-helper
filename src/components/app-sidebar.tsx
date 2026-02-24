import { Users, Settings, User, FolderOpen, FileText, Copy, CheckCircle, BarChart2, TrendingDown, DollarSign, Heart, Activity, Sparkles, ChevronRight, UserCheck, Sliders, AlertCircle, Star, MessageSquare, ClipboardList, Trophy, LogOut, TrendingUp, Shield, Home } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfilePopover } from "./UserProfilePopover"
import { useAuth } from "@/contexts/AuthContext"
import { useModulePermissions } from "@/hooks/useModulePermissions"
import { useInterfacePreferences } from "@/hooks/useInterfacePreferences"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
// SSO config não usada diretamente - seleção de módulos agora é interna
// import { getCRMModuleSelectUrl, getCRMLoginUrl } from "@/config/sso"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface AppSidebarProps {
  activeView: 'home-criacao' | 'users' | 'profile' | 'gestao-projetos' | 'gestao-contratos' | 'csm' | 'cs' | 'cs-churn' | 'cs-metricas' | 'cs-nps' | 'cs-csat' | 'cs-cancelamento' | 'gestao-cancelamentos' | 'gestao-nps' | 'gestao-csat' | 'copy' | 'aprovacao' | 'analise-bench' | 'projetos-operacao' | 'projetos-clientes' | 'projetos-metricas' | 'performance' | 'preferencias-interface' | 'cases-sucesso' | 'planejamento-conteudo' | 'varredura'
  onViewChange: (view: 'home-criacao' | 'users' | 'profile' | 'gestao-projetos' | 'gestao-contratos' | 'csm' | 'cs' | 'cs-churn' | 'cs-metricas' | 'cs-nps' | 'cs-csat' | 'cs-cancelamento' | 'gestao-cancelamentos' | 'gestao-nps' | 'gestao-csat' | 'copy' | 'aprovacao' | 'analise-bench' | 'projetos-operacao' | 'projetos-clientes' | 'projetos-metricas' | 'performance' | 'preferencias-interface' | 'cases-sucesso' | 'planejamento-conteudo' | 'varredura') => void
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { state, open, openMobile, isMobile } = useSidebar()
  const { profile, signOut } = useAuth()
  const { checkModulePermission, loading: permissionsLoading } = useModulePermissions()
  const { preferences } = useInterfacePreferences()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Debug log
  console.log('🎮 AppSidebar render - permissions loading:', permissionsLoading);
  console.log('🎮 AppSidebar render - profile:', profile?.name, profile?.role);
  
  // Item CSM para a seção CS
  const csmItem = {
    title: "CSM",
    icon: UserCheck,
    view: 'csm' as const,
    moduleName: 'csm',
    available: checkModulePermission('csm', 'view')
  }

  // Check if any submenu item is active to keep section open
  const isCSFormulariosActive = ['cs-cancelamento'].includes(activeView) || 
    ['/pesquisa-csat-interno', '/pesquisa-nps-interno', '/solicitacao-cancelamento-interno', '/gerar-forms'].includes(location.pathname)
  const isCSGestaoActive = ['gestao-cancelamentos', 'gestao-nps', 'gestao-csat'].includes(activeView) ||
    ['/gestao-cancelamentos', '/gestao-nps', '/gestao-csat'].includes(location.pathname)
  const isCSMetricasActive = ['cs-churn', 'cs-nps', 'cs-csat'].includes(activeView)
  const isCriacaoActive = ['aprovacao', 'copy', 'analise-bench', 'home-criacao'].includes(activeView) || location.pathname === '/aprovacao'
  const isSettingsActive = ['users', 'profile', 'preferencias-interface'].includes(activeView)
  const isProjetosActive = ['projetos-clientes', 'projetos-metricas'].includes(activeView)
  
  // Start menus closed - only open when user clicks or navigates to an item inside
  const [openCSFormularios, setOpenCSFormularios] = useState(false)
  const [openCSGestao, setOpenCSGestao] = useState(false)
  const [openCSMetricas, setOpenCSMetricas] = useState(false)
  const [openCriacao, setOpenCriacao] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)
  const [openProjetos, setOpenProjetos] = useState(false)
  const [openModulesDialog, setOpenModulesDialog] = useState(false)
  
  // Auto-open sections when navigating to an item within them
  useEffect(() => {
    if (isCSFormulariosActive) setOpenCSFormularios(true)
  }, [isCSFormulariosActive])
  
  useEffect(() => {
    if (isCSGestaoActive) setOpenCSGestao(true)
  }, [isCSGestaoActive])
  
  useEffect(() => {
    if (isCSMetricasActive) setOpenCSMetricas(true)
  }, [isCSMetricasActive])
  
  useEffect(() => {
    if (isCriacaoActive) setOpenCriacao(true)
  }, [isCriacaoActive])
  
  useEffect(() => {
    if (isSettingsActive) setOpenSettings(true)
  }, [isSettingsActive])
  
  useEffect(() => {
    if (isProjetosActive) setOpenProjetos(true)
  }, [isProjetosActive])

  // Definir submenus base para CS - Formulários
  const csFormulariosSubmenuBase = [
    {
      id: 'gerar-forms',
      title: "Gerar Forms",
      view: 'cs' as const,
      icon: FileText,
      route: '/gerar-forms',
    },
    {
      id: 'pesquisa-csat',
      title: "CSAT",
      view: 'cs' as const,
      icon: Star,
      route: '/pesquisa-csat-interno',
    },
    {
      id: 'pesquisa-nps',
      title: "NPS",
      view: 'cs' as const,
      icon: MessageSquare,
      route: '/pesquisa-nps-interno',
    },
    {
      id: 'cs-cancelamento',
      title: "CHURN",
      view: 'cs-cancelamento' as const,
      icon: AlertCircle,
      route: '/solicitacao-cancelamento-interno',
    },
  ];

  // Definir submenus base para CS - Gestão
  const csGestaoSubmenuBase = [
    {
      id: 'gestao-csat',
      title: "CSAT",
      view: 'gestao-csat' as const,
      icon: ClipboardList,
      route: '/gestao-csat',
    },
    {
      id: 'gestao-nps',
      title: "NPS",
      view: 'gestao-nps' as const,
      icon: ClipboardList,
      route: '/gestao-nps',
    },
    {
      id: 'gestao-cancelamentos',
      title: "CHURN",
      view: 'gestao-cancelamentos' as const,
      icon: FileText,
      route: '/gestao-cancelamentos',
    }
  ];

  // Definir submenus base para CS - Métricas
  const csMetricasSubmenuBase = [
    {
      id: 'cs-csat',
      title: "CSAT",
      view: 'cs-csat' as const,
      icon: Star,
    },
    {
      id: 'cs-nps',
      title: "NPS",
      view: 'cs-nps' as const,
      icon: Heart,
    },
    {
      id: 'cs-churn',
      title: "CHURN",
      view: 'cs-churn' as const,
      icon: TrendingDown,
    },
  ];

  const projetosSubmenuBase = [
    {
      id: 'projetos-clientes',
      title: "Clientes",
      view: 'projetos-clientes' as const,
      icon: Users,
    },
    {
      id: 'projetos-metricas',
      title: "Métricas Financeiras",
      view: 'projetos-metricas' as const,
      icon: DollarSign,
    }
  ];

  const criacaoSubmenuBase = [
    {
      id: 'copy',
      title: "Copy",
      view: 'copy' as const,
      icon: Copy,
    },
    {
      id: 'aprovacao',
      title: "Aprovação",
      view: 'aprovacao' as const,
      icon: CheckCircle,
      route: '/aprovacao'
    },
    {
      id: 'analise-bench',
      title: "Análise e Bench",
      view: 'analise-bench' as const,
      icon: BarChart2,
    }
  ];

  // Submenus para a seção CS
  const csFormulariosSubmenu = useMemo(() => csFormulariosSubmenuBase, []);
  const csGestaoSubmenu = useMemo(() => csGestaoSubmenuBase, []);
  const csMetricasSubmenu = useMemo(() => csMetricasSubmenuBase, []);

  const criacaoSubmenu = useMemo(() => criacaoSubmenuBase, []);

  const projetosSubmenu = useMemo(() => {
    return projetosSubmenuBase;
  }, []);

  // Item Cases de Sucesso
  const casesSuccessoItem = {
    title: "Cases de sucesso",
    icon: Trophy,
    view: 'cases-sucesso' as const,
    moduleName: 'cs',
    available: !permissionsLoading && checkModulePermission('cs', 'view'),
    route: '/cases-sucesso'
  }

  // Itens da seção CS
  const csItems = [
    {
      title: "Dashboards",
      icon: BarChart2,
      moduleName: 'cs',
      available: !permissionsLoading && checkModulePermission('cs', 'view'),
      hasSubmenu: true,
      isOpen: openCSMetricas,
      setIsOpen: setOpenCSMetricas,
      submenu: csMetricasSubmenu
    },
    {
      title: "Pipelines",
      icon: ClipboardList,
      moduleName: 'cs',
      available: !permissionsLoading && checkModulePermission('cs', 'view'),
      hasSubmenu: true,
      isOpen: openCSGestao,
      setIsOpen: setOpenCSGestao,
      submenu: csGestaoSubmenu
    },
    {
      title: "Formulários",
      icon: FileText,
      moduleName: 'cs',
      available: !permissionsLoading && checkModulePermission('cs', 'view'),
      hasSubmenu: true,
      isOpen: openCSFormularios,
      setIsOpen: setOpenCSFormularios,
      submenu: csFormulariosSubmenu
    }
  ]

  const operacaoItems = [
    {
      title: "Projetos",
      icon: FolderOpen,
      moduleName: 'projetos',
      available: checkModulePermission('projetos', 'view'),
      hasSubmenu: true,
      isOpen: openProjetos,
      setIsOpen: setOpenProjetos,
      submenu: projetosSubmenu
    },
    {
      title: "Performance",
      icon: Activity,
      view: 'performance' as const,
      moduleName: 'performance',
      available: checkModulePermission('performance', 'view')
    },
    {
      title: "Criação",
      icon: Sparkles,
      moduleName: 'criacao',
      available: !permissionsLoading && (checkModulePermission('copy', 'view') || checkModulePermission('aprovacao', 'view') || checkModulePermission('analise_bench', 'view')),
      hasSubmenu: true,
      isOpen: openCriacao,
      setIsOpen: setOpenCriacao,
      submenu: criacaoSubmenu
    }
  ]

  // Debug log dos itens
  console.log('🎮 Operação items availability:', {
    gestao_projetos: checkModulePermission('gestao_projetos', 'view'),
    gestao_contratos: checkModulePermission('gestao_contratos', 'view'),
    copy: checkModulePermission('copy', 'view'),
    analise_bench: checkModulePermission('analise_bench', 'view'),
    permissionsLoading
  });

  const profileItems = [
    {
      title: "Usuários",
      icon: Users,
      view: 'users' as const,
      moduleName: 'users',
      available: checkModulePermission('users', 'view')
    }
    // "Preferências da Interface" removido - toggle de tema agora fica no popover do usuário
  ]

  const isCollapsed = state === "collapsed"
  const shouldShowText = isMobile ? openMobile : open
  const shouldShowIcons = true // Ícones sempre visíveis


  const handleLogout = () => {
    // Adiciona animação de fade out suave
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';

    // Navega para a página de logout dedicada (que faz o signOut e redireciona)
    setTimeout(() => {
      document.body.style.opacity = '1';
      navigate('/logout');
    }, 150);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Sidebar side="left" collapsible="icon" className="border-r transition-all duration-300 ease-in-out">
      <SidebarHeader className={shouldShowText ? "p-4" : "py-4"}>
        {shouldShowText ? (
          <div className="flex items-center justify-between w-full px-4">
            <img 
              src="/lovable-uploads/7c396b9b-c7c8-460d-9683-1d9c1a265bd8.png"
              alt="DOT Logo"
              className="h-8 w-auto transition-all duration-500 ease-in-out"
              key="logo-expanded"
            />
            <SidebarTrigger className="touch-target" />
          </div>
        ) : (
          <div className="flex flex-col w-full gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-center h-8 hover:bg-transparent cursor-default p-2">
                  <img 
                    src="/dot-o-icon.png"
                    alt="DOT"
                    className="h-5 w-5 transition-all duration-500 ease-in-out"
                    key="logo-collapsed"
                    style={{ 
                      animation: 'spin 0.5s ease-in-out',
                    }}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-center h-8 p-2">
                  <SidebarTrigger />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Home button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {!shouldShowText ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => onViewChange('home-criacao')}
                        isActive={activeView === 'home-criacao'}
                        className="w-full transition-all duration-200 justify-center"
                        style={activeView === 'home-criacao' ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                      >
                        <Home className="h-4 w-4 flex-shrink-0" />
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Home</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <SidebarMenuButton
                    onClick={() => onViewChange('home-criacao')}
                    isActive={activeView === 'home-criacao'}
                    className="w-full transition-all duration-200 justify-start"
                    style={activeView === 'home-criacao' ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">Home</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Seção Criação para Performance */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#ec4a55]">Performance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {criacaoSubmenu.map((subItem) => {
                const isSubActive = subItem.route ? location.pathname === subItem.route : activeView === subItem.view
                return (
                  <SidebarMenuItem key={subItem.id}>
                    {!shouldShowText ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {subItem.route ? (
                            <SidebarMenuButton
                              asChild
                              isActive={isSubActive}
                              className="w-full transition-all duration-200 justify-center"
                              style={isSubActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                            >
                              <Link to={subItem.route}>
                                <subItem.icon className="h-4 w-4 flex-shrink-0" />
                              </Link>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              onClick={() => onViewChange(subItem.view)}
                              isActive={isSubActive}
                              className="w-full transition-all duration-200 justify-center"
                              style={isSubActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                            >
                              <subItem.icon className="h-4 w-4 flex-shrink-0" />
                            </SidebarMenuButton>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{subItem.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      subItem.route ? (
                        <SidebarMenuButton
                          asChild
                          isActive={isSubActive}
                          className="w-full transition-all duration-200 justify-start"
                          style={isSubActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                        >
                          <Link to={subItem.route}>
                            <subItem.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs">{subItem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          onClick={() => onViewChange(subItem.view)}
                          isActive={isSubActive}
                          className="w-full transition-all duration-200 justify-start"
                          style={isSubActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                        >
                          <subItem.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs">{subItem.title}</span>
                        </SidebarMenuButton>
                      )
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Seção Social Media */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#ec4a55]">Social Media</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { id: 'planejamento-conteudo', title: 'Planejamento de Conteúdo', icon: ClipboardList, route: '/social-media/planejamento' },
                { id: 'varredura', title: 'Varredura', icon: Activity, route: '/social-media/varredura' },
              ].map((item) => {
                const isActive = location.pathname === item.route;
                return (
                  <SidebarMenuItem key={item.id}>
                    {!shouldShowText ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className="w-full transition-all duration-200 justify-center"
                            style={isActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                          >
                            <Link to={item.route}>
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="w-full transition-all duration-200 justify-start"
                        style={isActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                      >
                        <Link to={item.route}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

          {/* Botão Voltar aos Módulos e Usuários */}
          <div className="mt-auto pt-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
              {/* Usuários - visível apenas para admin */}
                {profile?.effectiveRole === 'admin' && checkModulePermission('users', 'view') && (
                  <SidebarMenuItem>
                    {!shouldShowText ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => onViewChange('users')}
                            isActive={activeView === 'users'}
                            className="w-full justify-center transition-all duration-200"
                            style={activeView === 'users' ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                          >
                            <Users className="h-4 w-4" />
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Usuários</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        onClick={() => onViewChange('users')}
                        isActive={activeView === 'users'}
                        className="w-full justify-start transition-all duration-200"
                        style={activeView === 'users' ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                      >
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs">Usuários</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )}

                {/* Botão Voltar para Módulos */}
                <SidebarMenuItem>
                  <Dialog open={openModulesDialog} onOpenChange={setOpenModulesDialog}>
                    <DialogTrigger asChild>
                      {!shouldShowText ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton className="w-full justify-center transition-all duration-200">
                              <Settings className="h-4 w-4 text-[#ec4a55]" />
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Voltar para módulos</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <SidebarMenuButton className="w-full justify-start transition-all duration-200">
                          <Settings className="h-4 w-4 flex-shrink-0 text-[#ec4a55]" />
                          <span className="text-xs">Voltar para módulos</span>
                        </SidebarMenuButton>
                      )}
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl bg-[#0d1117] border-border/50" aria-describedby={undefined}>
                      <div className="flex flex-col items-center py-8">
                        {/* Logo Skala */}
                        <div className="flex items-center gap-2 mb-8">
                          <span className="text-3xl font-bold text-[#ec4a55]">Skala</span>
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        {/* Saudação */}
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                          Olá, {profile?.name?.split(' ')[0] || 'Usuário'}!
                        </h2>
                        <p className="text-muted-foreground mb-8">Escolha o módulo para continuar</p>
                        
                        {/* Cards de Módulos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-4">
                          {/* CRM */}
                          <button
                            onClick={() => {
                              setOpenModulesDialog(false);
                              window.location.href = 'https://skala.dotconceito.com';
                            }}
                            className="flex flex-col items-center p-8 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-[#ec4a55]/50 transition-all duration-300 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#ec4a55]/10 flex items-center justify-center mb-4 group-hover:bg-[#ec4a55]/20 transition-colors">
                              <TrendingUp className="h-8 w-8 text-[#ec4a55]" />
                            </div>
                            <span className="font-semibold text-foreground mb-1">SKALA CRM</span>
                            <span className="text-sm text-muted-foreground text-center">Gestão Comercial e Vendas</span>
                          </button>
                          
                          {/* Operação */}
                          <button
                            onClick={() => {
                              setOpenModulesDialog(false);
                              navigate('/dashboard?view=csm');
                              onViewChange('csm');
                            }}
                            className="flex flex-col items-center p-8 rounded-xl border border-[#ec4a55] bg-card/50 hover:bg-card transition-all duration-300 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#ec4a55]/10 flex items-center justify-center mb-4 group-hover:bg-[#ec4a55]/20 transition-colors">
                              <Settings className="h-8 w-8 text-[#ec4a55]" />
                            </div>
                            <span className="font-semibold text-foreground mb-1">SKALA Operação</span>
                            <span className="text-sm text-muted-foreground text-center">Gestão de Projetos e CS</span>
                          </button>
                          
                          {/* Admin */}
                          <button
                            onClick={() => {
                              setOpenModulesDialog(false);
                              window.location.href = 'https://skala.dotconceito.com/admin';
                            }}
                            className="flex flex-col items-center p-8 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-amber-500/50 transition-all duration-300 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                              <Shield className="h-8 w-8 text-amber-500" />
                            </div>
                            <span className="font-semibold text-foreground mb-1">SKALA Admin</span>
                            <span className="text-sm text-muted-foreground text-center">Administração do Sistema</span>
                          </button>
                        </div>
                        
                        {/* Botão Sair */}
                        <button
                          onClick={() => {
                            setOpenModulesDialog(false);
                            // Usar window.location para garantir navegação mesmo dentro do Dialog
                            window.location.href = '/logout';
                          }}
                          className="flex items-center gap-2 mt-8 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sair da conta</span>
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>

                {/* Botão Sair */}
                <SidebarMenuItem>
                  {!shouldShowText ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={handleLogout}
                          className="w-full justify-center transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Sair</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton
                      onClick={handleLogout}
                      className="w-full justify-start transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">Sair</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          </div>
      </SidebarContent>

      <SidebarFooter className={shouldShowText ? "p-4" : "py-4"}>
        <UserProfilePopover onLogout={handleLogout}>
          {shouldShowText ? (
            <div className="flex items-center gap-3 p-3 transition-all duration-200 cursor-pointer hover:bg-accent rounded-md">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={(profile as any)?.avatar_url} alt={profile?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {profile?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{profile?.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </span>
              </div>
            </div>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-center h-8 p-2 cursor-pointer">
                  <Avatar className="h-6 w-6 min-h-6 min-w-6 flex-shrink-0">
                    <AvatarImage src={(profile as any)?.avatar_url} alt={profile?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {profile?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </UserProfilePopover>
      </SidebarFooter>
    </Sidebar>
    </TooltipProvider>
  )
}