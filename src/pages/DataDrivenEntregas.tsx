import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageComingSoon } from "@/components/PageComingSoon";

const DataDrivenEntregas = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView={"home-criacao" as any} onViewChange={() => {}} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/data-driven")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-foreground">Gestão de Entregas</h1>
                  <p className="text-muted-foreground">Acompanhamento de entregas, prazos e status por cliente e squad.</p>
                </div>
              </div>
              <PageComingSoon
                title="Gestão de Entregas"
                subtitle="Módulo em desenvolvimento para acompanhamento completo de entregas."
                badgeLabel="Em breve"
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DataDrivenEntregas;
