import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { PageComingSoon } from "@/components/PageComingSoon";

const DataDriven = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView={"home-criacao" as any} onViewChange={() => {}} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">Data-Driven</h1>
                <p className="text-muted-foreground">Central de dados, inteligência e gestão estratégica da operação.</p>
              </div>
              <PageComingSoon
                title="Estamos construindo a central de inteligência e gestão da operação."
                badgeLabel="Data-Driven"
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DataDriven;
