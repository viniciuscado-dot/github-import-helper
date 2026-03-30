import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    id: "produtividade",
    title: "Gestão de Produtividade",
    subtitle: "Dashboards, produtividade do time e leitura estratégica de dados operacionais",
    icon: Activity,
    route: "/data-driven/produtividade",
  },
];

const DataDriven = () => {
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
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">Data-Driven</h1>
                <p className="text-muted-foreground">Central de dados, inteligência e gestão estratégica da operação.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod) => (
                  <Card
                    key={mod.id}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => navigate(mod.route)}
                  >
                    <CardContent className="p-6 flex flex-col gap-3">
                      <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <mod.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{mod.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DataDriven;
