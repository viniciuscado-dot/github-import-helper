import { Users, Settings, Copy, CheckCircle, BarChart2, Sparkles, LogOut, TrendingUp, Shield, Home, Video, Lightbulb, Layout, Eye, Newspaper, ClipboardList, Activity } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfilePopover } from "./UserProfilePopover"
import { useAuth } from "@/contexts/AuthContext"
import { useModulePermissions } from "@/hooks/useModulePermissions"
import { useInterfacePreferences } from "@/hooks/useInterfacePreferences"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface AppSidebarProps {
  activeView: 'home-criacao' | 'users' | 'profile' | 'copy' | 'aprovacao' | 'analise-bench' | 'preferencias-interface' | 'planejamento-conteudo' | 'varredura'
  onViewChange: (view: 'home-criacao' | 'users' | 'profile' | 'copy' | 'aprovacao' | 'analise-bench' | 'preferencias-interface' | 'planejamento-conteudo' | 'varredura') => void
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { state, open, openMobile, isMobile } = useSidebar()
  const { profile, signOut } = useAuth()
  const { checkModulePermission, loading: permissionsLoading } = useModulePermissions()
  const { preferences } = useInterfacePreferences()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [openModulesDialog, setOpenModulesDialog] = useState(false)

  const criacaoSubmenu = useMemo(() => [
    { id: 'copy', title: 'Copy', view: 'copy' as const, icon: Copy },
    { id: 'aprovacao', title: 'Aprovação', view: 'aprovacao' as const, icon: CheckCircle, route: '/aprovacao' },
    { id: 'analise-bench', title: 'Análise e Bench', view: 'analise-bench' as const, icon: BarChart2 },
  ], []);

  const isCollapsed = state === "collapsed"
  const shouldShowText = isMobile ? openMobile : open
  const shouldShowIcons = true

  const handleLogout = () => {
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    setTimeout(() => {
      document.body.style.opacity = '1';
      navigate('/logout');
    }, 150);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Sidebar side="left" collapsible="icon" className="border-r transition-all duration-300 ease-in-out">
      <SidebarHeader className={`flex-shrink-0 ${shouldShowText ? "p-4 pb-2" : "py-4 pb-2"}`}>
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
                    style={{ animation: 'spin 0.5s ease-in-out' }}
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

        {/* Home button - fixed in header */}
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            {!shouldShowText ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => onViewChange('home-criacao')}
                    isActive={activeView === 'home-criacao'}
                    className="w-full transition-all duration-150 ease-in-out justify-center py-2.5"
                    style={activeView === 'home-criacao' ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Home</p></TooltipContent>
              </Tooltip>
            ) : (
              <SidebarMenuButton
                onClick={() => onViewChange('home-criacao')}
                isActive={activeView === 'home-criacao'}
                className="w-full transition-all duration-150 ease-in-out justify-start py-2.5 gap-3"
                style={activeView === 'home-criacao' ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
              >
                <Home className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Home</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">
        {/* Seção Performance (Criação) */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#ec4a55] uppercase text-[10px] font-semibold tracking-wider opacity-70 mt-2">Performance</SidebarGroupLabel>
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
                        <TooltipContent side="right"><p>{subItem.title}</p></TooltipContent>
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
                { id: 'central-posts', title: 'Central de Posts', icon: Newspaper, route: '/social-media/central-posts' },
              ].map((item) => {
                const isActive = location.pathname === item.route;
                return (
                  <SidebarMenuItem key={item.id}>
                    {!shouldShowText ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild isActive={isActive}
                            className="w-full transition-all duration-200 justify-center"
                            style={isActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                          >
                            <Link to={item.route}><item.icon className="h-4 w-4 flex-shrink-0" /></Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>{item.title}</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        asChild isActive={isActive}
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

        {/* Seção Laboratório */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#ec4a55]">Laboratório</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { id: 'editor-video', title: 'Editor de Vídeo', icon: Video, route: '/laboratorio/editor-video' },
                { id: 'banco-ideias', title: 'Banco de Ideias', icon: Lightbulb, route: '/laboratorio/banco-ideias' },
                { id: 'lp-builder', title: 'LP Builder', icon: Layout, route: '/laboratorio/lp-builder' },
                { id: 'diagnostico-visual', title: 'Diagnóstico Visual', icon: Eye, route: '/laboratorio/diagnostico-visual' },
              ].map((item) => {
                const isActive = location.pathname === item.route;
                return (
                  <SidebarMenuItem key={item.id}>
                    {!shouldShowText ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild isActive={isActive}
                            className="w-full transition-all duration-200 justify-center"
                            style={isActive ? { backgroundColor: '#ec4a55', color: 'white' } : {}}
                          >
                            <Link to={item.route}><item.icon className="h-4 w-4 flex-shrink-0" /></Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>{item.title}</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        asChild isActive={isActive}
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

        {/* Admin + Módulos + Sair */}
        <div className="mt-auto pt-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Usuários - admin only */}
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
                        <TooltipContent side="right"><p>Usuários</p></TooltipContent>
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

                {/* Voltar para Módulos */}
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
                          <TooltipContent side="right"><p>Voltar para módulos</p></TooltipContent>
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
                        <div className="flex items-center gap-2 mb-8">
                          <span className="text-3xl font-bold text-[#ec4a55]">Skala</span>
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                          Olá, {profile?.name?.split(' ')[0] || 'Usuário'}!
                        </h2>
                        <p className="text-muted-foreground mb-8">Escolha o módulo para continuar</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-4">
                          <button
                            onClick={() => { setOpenModulesDialog(false); window.location.href = 'https://skala.dotconceito.com'; }}
                            className="flex flex-col items-center p-8 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-[#ec4a55]/50 transition-all duration-300 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#ec4a55]/10 flex items-center justify-center mb-4 group-hover:bg-[#ec4a55]/20 transition-colors">
                              <TrendingUp className="h-8 w-8 text-[#ec4a55]" />
                            </div>
                            <span className="font-semibold text-foreground mb-1">SKALA CRM</span>
                            <span className="text-sm text-muted-foreground text-center">Gestão Comercial e Vendas</span>
                          </button>
                          <button
                            onClick={() => { setOpenModulesDialog(false); navigate('/dashboard?view=home-criacao'); onViewChange('home-criacao'); }}
                            className="flex flex-col items-center p-8 rounded-xl border border-[#ec4a55] bg-card/50 hover:bg-card transition-all duration-300 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#ec4a55]/10 flex items-center justify-center mb-4 group-hover:bg-[#ec4a55]/20 transition-colors">
                              <Settings className="h-8 w-8 text-[#ec4a55]" />
                            </div>
                            <span className="font-semibold text-foreground mb-1">SKALA Operação</span>
                            <span className="text-sm text-muted-foreground text-center">Gestão de Projetos e CS</span>
                          </button>
                          <button
                            onClick={() => { setOpenModulesDialog(false); window.location.href = 'https://skala.dotconceito.com/admin'; }}
                            className="flex flex-col items-center p-8 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-amber-500/50 transition-all duration-300 group"
                          >
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                              <Shield className="h-8 w-8 text-amber-500" />
                            </div>
                            <span className="font-semibold text-foreground mb-1">SKALA Admin</span>
                            <span className="text-sm text-muted-foreground text-center">Administração do Sistema</span>
                          </button>
                        </div>
                        <button
                          onClick={() => { setOpenModulesDialog(false); window.location.href = '/logout'; }}
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
                      <TooltipContent side="right"><p>Sair</p></TooltipContent>
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
                <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
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
