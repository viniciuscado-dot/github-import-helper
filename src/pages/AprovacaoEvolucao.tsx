import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, Layers, BarChart3, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ChartExpandModal } from "@/components/approval/evolution/ChartExpandModal";
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

const SQUAD_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const MATERIAL_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Ainda não há dados suficientes para análise.
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="w-full h-full rounded-xl" />;
}

/* ── Individual chart renderers (reused in cards + modal) ── */

function OverallChart({ data }: { data: EvolutionPoint[] }) {
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradOverall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 5]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" fill="url(#gradOverall)" strokeWidth={2} name="Média Geral" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SquadChart({ squads, points }: { squads: string[]; points: SquadEvolutionPoint[] }) {
  if (!points.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 5]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Legend />
        {squads.map((sq, i) => (
          <Line key={sq} type="monotone" dataKey={sq} stroke={SQUAD_COLORS[i % SQUAD_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PersonChart({ data, selected }: { data: PersonEvolution[]; selected: string }) {
  const person = data.find(p => p.name === selected);
  if (!person || !person.points.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={person.points}>
        <defs>
          <linearGradient id="gradPerson" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 5]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Area type="monotone" dataKey="avg" stroke="hsl(var(--secondary))" fill="url(#gradPerson)" strokeWidth={2} name={selected} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MaterialChart({ data }: { data: MaterialTypeEvolution[] }) {
  if (!data.length || data.every(d => !d.points.length)) return <EmptyState />;
  // Merge all types into a single dataset
  const allWeeks = new Set<string>();
  data.forEach(d => d.points.forEach(p => allWeeks.add(p.date)));
  const sorted = Array.from(allWeeks).sort();
  const merged = sorted.map(week => {
    const point: Record<string, any> = { date: week, label: data[0]?.points.find(p => p.date === week)?.label || week.slice(5) };
    for (const d of data) {
      const found = d.points.find(p => p.date === week);
      point[d.type] = found?.avg || 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={merged}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 5]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Legend />
        {data.map((d, i) => (
          <Line key={d.type} type="monotone" dataKey={d.type} stroke={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function SquadComparisonChart({ data }: { data: SquadComparison[] }) {
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="squad" fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 5]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
        <Legend />
        <Bar dataKey="avgCopy" name="Copy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="avgDesign" name="Design" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Card wrapper ── */

function ChartCard({ title, icon: Icon, children, onExpand }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onExpand: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExpand}>
          <Expand className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 min-h-[220px]">
        {children}
      </div>
    </div>
  );
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

  /* Modal renderers that accept date range */
  const modalRenderers: Record<string, { title: string; render: (s?: string, e?: string) => React.ReactNode }> = {
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
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="aprovacao" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0" style={{ scrollbarGutter: "stable" }}>
            {/* Top bar */}
            <div className="border-b border-border/60 bg-background sticky top-0 z-10">
              <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-end h-14">
                <NotificationCenter />
              </div>
            </div>

            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Evolução das Aprovações</h1>
                  <p className="text-muted-foreground text-sm">Análise histórica de desempenho criativo</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/aprovacao")}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Aprovação
                </Button>
              </div>

              {/* Charts grid */}
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-4 md:p-5 min-h-[280px]">
                      <ChartSkeleton />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <ChartCard title="Aprovação Geral" icon={TrendingUp} onExpand={() => setExpandedChart("overall")}>
                    <OverallChart data={overall} />
                  </ChartCard>

                  <ChartCard title="Evolução por Squad" icon={Users} onExpand={() => setExpandedChart("squad")}>
                    <SquadChart squads={squadEvol.squads} points={squadEvol.points} />
                  </ChartCard>

                  <ChartCard title="Evolução por Pessoa" icon={Users} onExpand={() => setExpandedChart("person")}>
                    <div className="mb-2">
                      <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {persons.map(p => (
                            <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1" style={{ height: "calc(100% - 40px)" }}>
                      <PersonChart data={persons} selected={selectedPerson} />
                    </div>
                  </ChartCard>

                  <ChartCard title="Evolução por Material" icon={Layers} onExpand={() => setExpandedChart("material")}>
                    <MaterialChart data={materials} />
                  </ChartCard>

                  <ChartCard title="Comparativo de Squads" icon={BarChart3} onExpand={() => setExpandedChart("comparison")}>
                    <SquadComparisonChart data={squadComp} />
                  </ChartCard>
                </div>
              )}
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

/* Helper: loads data inside modal with its own loading state */
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
