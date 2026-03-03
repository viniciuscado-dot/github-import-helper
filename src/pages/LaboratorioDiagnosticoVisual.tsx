import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PageComingSoon } from "@/components/PageComingSoon";
import { useNavigate } from "react-router-dom";

export default function LaboratorioDiagnosticoVisual() {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="home-criacao" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 flex flex-col">
            <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-end h-14">
                <NotificationCenter />
              </div>
            </div>
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6 flex-1">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Diagnóstico Visual</h1>
                <p className="text-muted-foreground">Avaliação técnica automática de criativos.</p>
              </div>
              <PageComingSoon
                title="Estamos preparando uma ferramenta de diagnóstico visual inteligente."
                subtitle="Funcionalidade em desenvolvimento."
                badgeLabel="Laboratório"
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
