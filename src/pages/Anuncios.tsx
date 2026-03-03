import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { PageComingSoon } from "@/components/PageComingSoon";
import { useNavigate } from "react-router-dom";

export default function Anuncios() {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="anuncios" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0" style={{ scrollbarGutter: "stable" }}>
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Anúncios</h1>
                <p className="text-muted-foreground">Gestão estratégica de campanhas e performance paga.</p>
              </div>
              <PageComingSoon
                title="Estamos preparando um módulo completo de gestão e análise de anúncios."
                subtitle="Em breve você poderá gerenciar suas campanhas pagas diretamente por aqui."
                badgeLabel="Em desenvolvimento"
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
