import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { PageComingSoon } from "@/components/PageComingSoon";
import { useNavigate } from "react-router-dom";

export default function LaboratorioEditorVideo() {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="home-criacao" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 flex flex-col">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6 flex-1">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editor de Vídeo</h1>
                <p className="text-muted-foreground">Ferramenta avançada de edição e testes criativos.</p>
              </div>
              <PageComingSoon
                title="Estamos preparando uma ferramenta avançada de edição."
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
