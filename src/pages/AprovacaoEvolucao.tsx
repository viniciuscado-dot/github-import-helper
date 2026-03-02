import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, Layers, BarChart3, Expand, BarChart2 } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
        <BarChart2 className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Ainda não há dados suficientes</p>
        <p className="text-xs text-muted-foreground/60">Comece avaliando criativos para visualizar a evolução.</p>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="w-full h-full rounded-xl" />;
}

/* ── Chart renderers ── */

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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
        <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" fill="url(#gradOverall)" strokeWidth={2.5} name="Média Geral" dot={{ r: 3, fill: "hsl(var(--primary))" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SquadChart({ squads, points }: { squads: string[]; points: SquadEvolutionPoint[] }) {
  if (!points.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {squads.map((sq, i) => (
          <Line key={sq} type="monotone" dataKey={sq} stroke={SQUAD_COLORS[i % SQUAD_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
        <Area type="monotone" dataKey="avg" stroke="hsl(var(--secondary))" fill="url(#gradPerson)" strokeWidth={2.5} name={selected} dot={{ r: 3, fill: "hsl(var(--secondary))" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MaterialChart({ data }: { data: MaterialTypeEvolution[] }) {
  if (!data.length || data.every(d => !d.points.length)) return <EmptyState />;
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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {data.map((d, i) => (
          <Line key={d.type} type="monotone" dataKey={d.type} stroke={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function SquadComparisonChart({ data }: { data: SquadComparison[] }) {
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="squad" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="avgCopy" name="Copy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        <Bar dataKey="avgDesign" name="Design" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Chart card with subtitle ── */

const CHART_META: Record<string, { subtitle: string }> = {
  "Aprovação Geral": { subtitle: "Média histórica das notas ao longo do tempo" },
  "Evolução por Squad": { subtitle: "Desempenho comparativo entre squads" },
  "Evolução por Pessoa": { subtitle: "Performance individual ao longo do tempo" },
  "Evolução por Material": { subtitle: "Notas por tipo de material criativo" },
  "Comparativo de Squads": { subtitle: "Médias atuais de Copy e Design por squad" },
};

function ChartCard({ title, icon: Icon, children, onExpand }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onExpand: () => void;
}) {
  const meta = CHART_META[title];
  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
            {meta && <p className="text-[11px] text-muted-foreground mt-0.5">{meta.subtitle}</p>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onExpand}>
          <Expand className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mx-6 border-t border-border/30" />
      {/* Chart area */}
      <div className="flex-1 min-h-[340px] px-4 pb-5 pt-4">
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
            <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="max-w-[1480px] mx-auto px-4 md:px-8 flex items-center justify-end h-14">
                <NotificationCenter />
              </div>
            </div>

            <main className="max-w-[1480px] mx-auto px-4 md:px-8 py-8 space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Evolução das Aprovações</h1>
                  <p className="text-muted-foreground text-sm mt-1">Análise histórica de desempenho criativo</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => navigate("/aprovacao")}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Aprovação
                </Button>
              </div>

              {/* Charts grid */}
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl border border-border/40 bg-card/80 p-6 min-h-[420px]">
                      <ChartSkeleton />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Row 1 — temporal evolution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Aprovação Geral" icon={TrendingUp} onExpand={() => setExpandedChart("overall")}>
                      <OverallChart data={overall} />
                    </ChartCard>

                    <ChartCard title="Evolução por Squad" icon={Users} onExpand={() => setExpandedChart("squad")}>
                      <SquadChart squads={squadEvol.squads} points={squadEvol.points} />
                    </ChartCard>
                  </div>

                  {/* Row 2 — person + material */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Evolução por Pessoa" icon={Users} onExpand={() => setExpandedChart("person")}>
                      <div className="mb-4">
                        <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                          <SelectTrigger className="w-[240px] h-9 text-sm bg-muted/40 border-border/40">
                            <SelectValue placeholder="Selecione uma pessoa..." />
                          </SelectTrigger>
                          <SelectContent>
                            {persons.map(p => (
                              <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div style={{ height: "calc(100% - 52px)" }}>
                        <PersonChart data={persons} selected={selectedPerson} />
                      </div>
                    </ChartCard>

                    <ChartCard title="Evolução por Material" icon={Layers} onExpand={() => setExpandedChart("material")}>
                      <MaterialChart data={materials} />
                    </ChartCard>
                  </div>

                  {/* Row 3 — comparison (full width) */}
                  <ChartCard title="Comparativo de Squads" icon={BarChart3} onExpand={() => setExpandedChart("comparison")}>
                    <SquadComparisonChart data={squadComp} />
                  </ChartCard>
                </>
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
