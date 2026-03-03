import { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, LogOut, LayoutDashboard, Columns3, List } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalDashboard } from "@/components/approval/ApprovalDashboard";
import { ApprovalKanbanView } from "@/components/approval/ApprovalKanbanView";
import { ApprovalListView } from "@/components/approval/ApprovalListView";
import { JobDialog } from "@/components/approval/JobDialog";
import { DateRangeFilter } from "@/components/approval/layout/DateRangeFilter";
import { layoutTokens } from "@/components/approval/layout/layoutTokens";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUniqueClients } from "@/services/approvalDataService";
import { getAllActiveUsers } from "@/utils/getActiveUsers";

type ApprovalTab = "dashboard" | "kanban" | "lista";

export interface ApprovalFilters {
  creator?: string;
  client?: string;
  squad?: string;
  materialType?: string;
  startDate?: string;
  endDate?: string;
}

export default function Aprovacao() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ApprovalTab>("dashboard");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [kanbanStatusFilter, setKanbanStatusFilter] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Shared filter state (SSOT) ──
  const [creator, setCreator] = useState("all");
  const [client, setClient] = useState("all");
  const [squad, setSquad] = useState("all");
  const [materialType, setMaterialType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [clients, setClients] = useState<string[]>([]);
  useEffect(() => { getUniqueClients().then(setClients); }, []);
  const creators = useMemo(() => getAllActiveUsers(), []);
  const squadOptions = ["Athena", "Ártemis", "Ares", "Apollo"];

  const filters = useMemo<ApprovalFilters>(() => ({
    creator: creator !== "all" ? creator : undefined,
    client: client !== "all" ? client : undefined,
    squad: squad !== "all" ? squad : undefined,
    materialType: materialType !== "all" ? materialType : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [creator, client, squad, materialType, startDate, endDate]);

  const handleClearFilters = useCallback(() => {
    setCreator("all");
    setClient("all");
    setSquad("all");
    setMaterialType("all");
    setStartDate("");
    setEndDate("");
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavigateToKanban = useCallback((statusFilter?: string) => {
    setKanbanStatusFilter(statusFilter);
    setActiveTab("kanban");
  }, []);

  const handleNewJob = () => {
    setIsJobDialogOpen(true);
  };

  // Setters exposed to children (e.g. Dashboard chip clicks)
  const filterSetters = useMemo(() => ({
    setCreator,
    setClient,
    setSquad,
    setMaterialType,
    setStartDate,
    setEndDate,
  }), []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="aprovacao" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0" style={{ scrollbarGutter: "stable" }}>
            <TopBar />

            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Page title — same style as CopyForm */}
              <div>
                <h1 className="text-2xl font-bold text-foreground">Aprovação de Materiais</h1>
                <p className="text-muted-foreground">
                  Acompanhe o status, avaliações e histórico das aprovações.
                </p>
              </div>

              {/* Sub-navigation + actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ApprovalTab); setKanbanStatusFilter(undefined); }}>
                  <TabsList className="h-9 bg-muted/60">
                    <TabsTrigger value="dashboard" className="gap-1.5 text-xs px-3">
                      <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="kanban" className="gap-1.5 text-xs px-3">
                      <Columns3 className="h-3.5 w-3.5" /> Kanban
                    </TabsTrigger>
                    <TabsTrigger value="lista" className="gap-1.5 text-xs px-3">
                      <List className="h-3.5 w-3.5" /> Lista
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button size="sm" className="gap-1.5 text-white h-9" onClick={handleNewJob}>
                  <Plus className="h-3.5 w-3.5" /> Aprovar Material
                </Button>
              </div>
              {/* ── Shared filter (SSOT) ── */}
              <div className={`${layoutTokens.card.base} ${layoutTokens.card.padding}`}>
                <DateRangeFilter
                  responsible={creator}
                  onResponsibleChange={setCreator}
                  client={client}
                  onClientChange={setClient}
                  squad={squad}
                  onSquadChange={setSquad}
                  materialType={materialType}
                  onMaterialTypeChange={setMaterialType}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  responsibleOptions={creators}
                  responsibleLabel="Criador"
                  clientOptions={clients}
                  squadOptions={squadOptions}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Active Filter Chips */}
              {(creator !== "all" || client !== "all" || squad !== "all" || materialType !== "all" || startDate || endDate) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                  {creator !== "all" && (
                    <button
                      onClick={() => setCreator("all")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      Criador: {creator}
                      <span className="opacity-60">✕</span>
                    </button>
                  )}
                  {squad !== "all" && (
                    <button
                      onClick={() => setSquad("all")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      Squad: {squad}
                      <span className="opacity-60">✕</span>
                    </button>
                  )}
                  {client !== "all" && (
                    <button
                      onClick={() => setClient("all")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      Cliente: {client}
                      <span className="opacity-60">✕</span>
                    </button>
                  )}
                  {materialType !== "all" && (
                    <button
                      onClick={() => setMaterialType("all")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      Tipo: {materialType === "estaticos" ? "Estáticos" : materialType === "videos" ? "Vídeos" : materialType === "carrossel" ? "Carrossel" : "Landing Page"}
                      <span className="opacity-60">✕</span>
                    </button>
                  )}
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      Período: {startDate || "..."} → {endDate || "..."}
                      <span className="opacity-60">✕</span>
                    </button>
                  )}
                </div>
              )}

              {activeTab === "dashboard" ? (
                <ApprovalDashboard
                  filters={filters}
                  filterSetters={filterSetters}
                  onNavigateToKanban={handleNavigateToKanban}
                />
              ) : activeTab === "kanban" ? (
                <ApprovalKanbanView
                  key={refreshKey}
                  filters={filters}
                  initialStatusFilter={kanbanStatusFilter}
                />
              ) : (
                <ApprovalListView filters={filters} />
              )}
            <JobDialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen} onSave={() => setRefreshKey(k => k + 1)} />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
