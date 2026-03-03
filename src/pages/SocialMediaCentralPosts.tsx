import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { PageComingSoon } from "@/components/PageComingSoon";
import { useNavigate } from "react-router-dom";

export default function SocialMediaCentralPosts() {
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
                <h1 className="text-2xl font-bold text-foreground">Central de Posts</h1>
                <p className="text-muted-foreground">Organização e gestão de posts sociais.</p>
              </div>
              <PageComingSoon
                title="Estamos preparando um módulo completo para gestão de posts."
                subtitle="Organização e gestão de posts sociais em construção."
                badgeLabel="Social Media"
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
