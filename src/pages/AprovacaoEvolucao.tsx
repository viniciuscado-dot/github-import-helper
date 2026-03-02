import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, Layers, BarChart3, Expand, BarChart2, GripVertical, Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ChartExpandModal } from "@/components/approval/evolution/ChartExpandModal";
import {
  OverallChart,
  SquadChart,
  PersonChart,
  MaterialChart,
  SquadComparisonChart,
  EmptyState,
} from "@/components/approval/evolution/EvolutionCharts";
import {
  getOverallEvolution,
  getSquadEvolution,
  getPersonEvolution,
  getMaterialTypeEvolution,
  getSquadComparison,
  type EvolutionPoint,
  type SquadEvolutionPoint,
  type PersonEvolution,
  type MaterialTypeEvolution,
  type SquadComparison,
} from "@/services/evolutionDataService";
import { Responsive } from "react-grid-layout";
import WidthProvider from "react-grid-layout/lib/components/WidthProvider";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const CHART_META: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  overall: { title: "Aprovação Geral", subtitle: "Média histórica das notas ao longo do tempo", icon: TrendingUp },
  squad: { title: "Evolução por Squad", subtitle: "Desempenho comparativo entre squads", icon: Users },
  person: { title: "Evolução por Pessoa", subtitle: "Performance individual ao longo do tempo", icon: Users },
  material: { title: "Evolução por Material", subtitle: "Notas por tipo de material criativo", icon: Layers },
  comparison: { title: "Comparativo de Squads", subtitle: "Médias atuais de Copy e Design por squad", icon: BarChart3 },
};

const DEFAULT_LAYOUTS = {
  lg: [
    { i: "overall", x: 0, y: 0, w: 1, h: 1, minW: 1, maxW: 3 },
    { i: "squad", x: 1, y: 0, w: 1, h: 1, minW: 1, maxW: 3 },
    { i: "material", x: 2, y: 0, w: 1, h: 1, minW: 1, maxW: 3 },
    { i: "person", x: 0, y: 1, w: 1, h: 1, minW: 1, maxW: 3 },
    { i: "comparison", x: 1, y: 1, w: 2, h: 1, minW: 1, maxW: 3 },
  ],
  md: [
    { i: "overall", x: 0, y: 0, w: 1, h: 1 },
    { i: "squad", x: 1, y: 0, w: 1, h: 1 },
    { i: "material", x: 0, y: 1, w: 1, h: 1 },
    { i: "person", x: 1, y: 1, w: 1, h: 1 },
    { i: "comparison", x: 0, y: 2, w: 2, h: 1 },
  ],
  sm: [
    { i: "overall", x: 0, y: 0, w: 1, h: 1 },
    { i: "squad", x: 0, y: 1, w: 1, h: 1 },
    { i: "material", x: 0, y: 2, w: 1, h: 1 },
    { i: "person", x: 0, y: 3, w: 1, h: 1 },
    { i: "comparison", x: 0, y: 4, w: 1, h: 1 },
  ],
};

const LAYOUT_STORAGE_KEY = "evolution-dashboard-layout";

function loadSavedLayouts() {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_LAYOUTS;
}

function ChartSkeleton() {
  return <Skeleton className="w-full h-full rounded-xl" />;
}

/* ── Chart card wrapper ── */
function ChartCard({
  chartKey,
  isEditing,
  children,
  onExpand,
}: {
  chartKey: string;
  isEditing: boolean;
  children: React.ReactNode;
  onExpand: () => void;
}) {
  const meta = CHART_META[chartKey];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <div className={`h-full rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${isEditing ? "border-primary/40 ring-1 ring-primary/20" : "border-border/40 hover:shadow-md"}`}>
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {isEditing && (
            <div className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{meta.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{meta.subtitle}</p>
          </div>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0" onClick={onExpand}>
            <Expand className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="mx-5 border-t border-border/30" />
      {/* Chart */}
      <div className="flex-1 px-3 pb-3 pt-3 min-h-0">
        {children}
      </div>
    </div>
  );
}

/* ── Modal chart loader ── */
function ModalChartLoader<T>({ fetcher, render }: { fetcher: () => Promise<T>; render: (data: T) => React.ReactNode }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetcher().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [fetcher]);

  if (loading) return <ChartSkeleton />;
  if (!data) return <EmptyState />;
  return <>{render(data)}</>;
}

/* ── Main page ── */
export default function AprovacaoEvolucao() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<EvolutionPoint[]>([]);
  const [squadEvol, setSquadEvol] = useState<{ squads: string[]; points: SquadEvolutionPoint[] }>({ squads: [], points: [] });
  const [persons, setPersons] = useState<PersonEvolution[]>([]);
  const [materials, setMaterials] = useState<MaterialTypeEvolution[]>([]);
  const [squadComp, setSquadComp] = useState<SquadComparison[]>([]);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [layouts, setLayouts] = useState(loadSavedLayouts);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sq, pe, ma, sc] = await Promise.all([
        getOverallEvolution(),
        getSquadEvolution(),
        getPersonEvolution(),
        getMaterialTypeEvolution(),
        getSquadComparison(),
      ]);
      setOverall(ov);
      setSquadEvol(sq);
      setPersons(pe);
      setMaterials(ma);
      setSquadComp(sc);
      if (pe.length && !selectedPerson) setSelectedPerson(pe[0].name);
    } catch (err) {
      console.error("Error loading evolution data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleLayoutChange = useCallback((_: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(allLayouts));
  }, []);

  const resetLayout = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUTS));
  }, []);

  const modalRenderers: Record<string, { title: string; render: (s?: string, e?: string) => React.ReactNode }> = useMemo(() => ({
    overall: {
      title: "Aprovação Geral — Evolução Temporal",
      render: (s, e) => <ModalChartLoader fetcher={() => getOverallEvolution(s, e)} render={d => <OverallChart data={d} />} />,
    },
    squad: {
      title: "Evolução por Squad",
      render: (s, e) => <ModalChartLoader fetcher={() => getSquadEvolution(s, e)} render={d => <SquadChart squads={d.squads} points={d.points} />} />,
    },
    person: {
      title: `Evolução — ${selectedPerson}`,
      render: (s, e) => <ModalChartLoader fetcher={() => getPersonEvolution(s, e)} render={d => <PersonChart data={d} selected={selectedPerson} />} />,
    },
    material: {
      title: "Evolução por Tipo de Material",
      render: (s, e) => <ModalChartLoader fetcher={() => getMaterialTypeEvolution(s, e)} render={d => <MaterialChart data={d} />} />,
    },
    comparison: {
      title: "Comparativo de Squads",
      render: (s, e) => <ModalChartLoader fetcher={() => getSquadComparison(s, e)} render={d => <SquadComparisonChart data={d} />} />,
    },
  }), [selectedPerson]);

  const renderChart = (key: string) => {
    if (loading) return <ChartSkeleton />;
    switch (key) {
      case "overall": return <OverallChart data={overall} />;
      case "squad": return <SquadChart squads={squadEvol.squads} points={squadEvol.points} />;
      case "person": return (
        <div className="flex flex-col h-full">
          <div className="mb-3 shrink-0">
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger className="w-full max-w-[260px] h-9 text-sm bg-muted/40 border-border/40">
                <SelectValue placeholder="Selecione uma pessoa..." />
              </SelectTrigger>
              <SelectContent>
                {persons.map(p => (
                  <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-h-0">
            <PersonChart data={persons} selected={selectedPerson} />
          </div>
        </div>
      );
      case "material": return <MaterialChart data={materials} />;
      case "comparison": return <SquadComparisonChart data={squadComp} />;
      default: return null;
    }
  };

  const chartKeys = ["overall", "squad", "material", "person", "comparison"];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="aprovacao" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
            {/* Top bar */}
            <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="px-4 md:px-6 flex items-center justify-end h-14">
                <NotificationCenter />
              </div>
            </div>

            <main className="px-4 md:px-6 py-6 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Evolução das Aprovações</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">Análise histórica de desempenho criativo</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={resetLayout}>
                      <RotateCcw className="h-3 w-3" /> Resetar
                    </Button>
                  )}
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Settings2 className="h-3 w-3" />
                    {isEditing ? "Salvar Layout" : "Personalizar"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => navigate("/aprovacao")}>
                    <ArrowLeft className="h-3 w-3" /> Voltar
                  </Button>
                </div>
              </div>

              {/* Grid */}
              <div className="evolution-grid-wrapper">
                <ResponsiveGridLayout
                  className="layout"
                  layouts={layouts}
                  breakpoints={{ lg: 1200, md: 768, sm: 0 }}
                  cols={{ lg: 3, md: 2, sm: 1 }}
                  rowHeight={420}
                  margin={[16, 16]}
                  containerPadding={[0, 0]}
                  isDraggable={isEditing}
                  isResizable={isEditing}
                  onLayoutChange={handleLayoutChange}
                  draggableHandle=".cursor-grab"
                  resizeHandles={["se"]}
                >
                  {chartKeys.map(key => (
                    <div key={key}>
                      <ChartCard
                        chartKey={key}
                        isEditing={isEditing}
                        onExpand={() => setExpandedChart(key)}
                      >
                        {renderChart(key)}
                      </ChartCard>
                    </div>
                  ))}
                </ResponsiveGridLayout>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>

      {/* Expand modal */}
      {expandedChart && modalRenderers[expandedChart] && (
        <ChartExpandModal
          open={!!expandedChart}
          onOpenChange={(open) => { if (!open) setExpandedChart(null); }}
          title={modalRenderers[expandedChart].title}
        >
          {(s, e) => modalRenderers[expandedChart].render(s, e)}
        </ChartExpandModal>
      )}
    </SidebarProvider>
  );
}
