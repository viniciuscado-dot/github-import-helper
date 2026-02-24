import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { PageComingSoon } from "@/components/PageComingSoon";
import { useNavigate } from "react-router-dom";

export default function SocialMediaPlanejamento() {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="planejamento-conteudo" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 flex flex-col">
            <PageComingSoon
              title="Planejamento de Conteúdo"
              subtitle="Estamos preparando algo estratégico para você."
              badgeLabel="Social Media"
            />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
