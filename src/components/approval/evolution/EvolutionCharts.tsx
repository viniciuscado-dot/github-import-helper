import { BarChart2 } from "lucide-react";
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
import type {
  EvolutionPoint,
  SquadEvolutionPoint,
  PersonEvolution,
  MaterialTypeEvolution,
  SquadComparison,
} from "@/services/evolutionDataService";

const SQUAD_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const MATERIAL_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

const AXIS_STYLE = { fontSize: 11, stroke: "hsl(var(--muted-foreground))", tickLine: false as const, axisLine: false as const };
const TOOLTIP_STYLE = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 };
const GRID_STYLE = { strokeDasharray: "3 3", stroke: "hsl(var(--border))", opacity: 0.3 };

export function EmptyState() {
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

export function OverallChart({ data }: { data: EvolutionPoint[] }) {
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
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="label" {...AXIS_STYLE} />
        <YAxis domain={[0, 5]} {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" fill="url(#gradOverall)" strokeWidth={2.5} name="Média Geral" dot={{ r: 3, fill: "hsl(var(--primary))" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SquadChart({ squads, points }: { squads: string[]; points: SquadEvolutionPoint[] }) {
  if (!points.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="label" {...AXIS_STYLE} />
        <YAxis domain={[0, 5]} {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {squads.map((sq, i) => (
          <Line key={sq} type="monotone" dataKey={sq} stroke={SQUAD_COLORS[i % SQUAD_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PersonChart({ data, selected }: { data: PersonEvolution[]; selected: string }) {
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
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="label" {...AXIS_STYLE} />
        <YAxis domain={[0, 5]} {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="avg" stroke="hsl(var(--secondary))" fill="url(#gradPerson)" strokeWidth={2.5} name={selected} dot={{ r: 3, fill: "hsl(var(--secondary))" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MaterialChart({ data }: { data: MaterialTypeEvolution[] }) {
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
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="label" {...AXIS_STYLE} />
        <YAxis domain={[0, 5]} {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {data.map((d, i) => (
          <Line key={d.type} type="monotone" dataKey={d.type} stroke={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SquadComparisonChart({ data }: { data: SquadComparison[] }) {
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={4}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="squad" {...AXIS_STYLE} />
        <YAxis domain={[0, 5]} {...AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="avgCopy" name="Copy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        <Bar dataKey="avgDesign" name="Design" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
