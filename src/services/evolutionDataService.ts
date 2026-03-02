import { supabase } from "@/integrations/supabase/external-client";
import { format, subDays, parseISO } from "date-fns";

export interface EvolutionPoint {
  date: string;
  label: string;
  avg: number;
  count: number;
}

export interface SquadEvolutionPoint {
  date: string;
  label: string;
  [squad: string]: string | number;
}

export interface PersonEvolution {
  name: string;
  points: EvolutionPoint[];
}

export interface MaterialTypeEvolution {
  type: string;
  points: EvolutionPoint[];
}

export interface SquadComparison {
  squad: string;
  avgCopy: number;
  avgDesign: number;
  avgTotal: number;
  count: number;
}

interface RawEval {
  copy_score: number | null;
  design_score: number | null;
  submitted_at: string | null;
  created_at: string;
  project_id: string | null;
}

interface RawProject {
  id: string;
  squad: string | null;
  designer_name: string | null;
  copywriter_name: string | null;
  material_type: string | null;
}

async function fetchEvaluationsAndProjects(startDate?: string, endDate?: string) {
  let evalQuery = supabase
    .from("evaluations")
    .select("copy_score, design_score, submitted_at, created_at, project_id")
    .not("copy_score", "is", null);

  if (startDate) evalQuery = evalQuery.gte("submitted_at", startDate);
  if (endDate) evalQuery = evalQuery.lte("submitted_at", endDate + "T23:59:59");

  const { data: evals } = await evalQuery;
  const { data: projects } = await supabase.from("projects").select("id, squad, designer_name, copywriter_name, material_type");

  const projectMap = new Map<string, RawProject>();
  (projects || []).forEach((p: RawProject) => projectMap.set(p.id, p));

  return { evals: (evals || []) as RawEval[], projectMap };
}

function groupByWeek(evals: { date: string; score: number }[]): EvolutionPoint[] {
  const weekMap = new Map<string, { total: number; count: number }>();

  for (const e of evals) {
    const d = parseISO(e.date);
    const weekStart = subDays(d, d.getDay());
    const key = format(weekStart, "yyyy-MM-dd");
    const entry = weekMap.get(key) || { total: 0, count: 0 };
    entry.total += e.score;
    entry.count += 1;
    weekMap.set(key, entry);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total, count }]) => ({
      date,
      label: format(parseISO(date), "dd/MM"),
      avg: Math.round((total / count) * 10) / 10,
      count,
    }));
}

export async function getOverallEvolution(startDate?: string, endDate?: string): Promise<EvolutionPoint[]> {
  const { evals } = await fetchEvaluationsAndProjects(startDate, endDate);

  const scored = evals
    .filter(e => e.copy_score != null || e.design_score != null)
    .map(e => ({
      date: e.submitted_at || e.created_at,
      score: ((e.copy_score || 0) + (e.design_score || 0)) / ((e.copy_score ? 1 : 0) + (e.design_score ? 1 : 0) || 1),
    }));

  return groupByWeek(scored);
}

export async function getSquadEvolution(startDate?: string, endDate?: string): Promise<{ squads: string[]; points: SquadEvolutionPoint[] }> {
  const { evals, projectMap } = await fetchEvaluationsAndProjects(startDate, endDate);

  const squadData = new Map<string, Map<string, { total: number; count: number }>>();

  for (const e of evals) {
    const proj = e.project_id ? projectMap.get(e.project_id) : null;
    const squad = proj?.squad || "Sem squad";
    const score = ((e.copy_score || 0) + (e.design_score || 0)) / ((e.copy_score ? 1 : 0) + (e.design_score ? 1 : 0) || 1);
    const d = parseISO(e.submitted_at || e.created_at);
    const weekStart = format(subDays(d, d.getDay()), "yyyy-MM-dd");

    if (!squadData.has(squad)) squadData.set(squad, new Map());
    const weekMap = squadData.get(squad)!;
    const entry = weekMap.get(weekStart) || { total: 0, count: 0 };
    entry.total += score;
    entry.count += 1;
    weekMap.set(weekStart, entry);
  }

  const squads = Array.from(squadData.keys()).sort();
  const allWeeks = new Set<string>();
  squadData.forEach(wm => wm.forEach((_, k) => allWeeks.add(k)));
  const sortedWeeks = Array.from(allWeeks).sort();

  const points: SquadEvolutionPoint[] = sortedWeeks.map(week => {
    const point: SquadEvolutionPoint = { date: week, label: format(parseISO(week), "dd/MM") };
    for (const sq of squads) {
      const entry = squadData.get(sq)?.get(week);
      point[sq] = entry ? Math.round((entry.total / entry.count) * 10) / 10 : 0;
    }
    return point;
  });

  return { squads, points };
}

export async function getPersonEvolution(startDate?: string, endDate?: string): Promise<PersonEvolution[]> {
  const { evals, projectMap } = await fetchEvaluationsAndProjects(startDate, endDate);

  const personData = new Map<string, { date: string; score: number }[]>();

  for (const e of evals) {
    const proj = e.project_id ? projectMap.get(e.project_id) : null;
    const names = [proj?.designer_name, proj?.copywriter_name].filter(Boolean) as string[];
    const score = ((e.copy_score || 0) + (e.design_score || 0)) / ((e.copy_score ? 1 : 0) + (e.design_score ? 1 : 0) || 1);

    for (const name of names) {
      if (!personData.has(name)) personData.set(name, []);
      personData.get(name)!.push({ date: e.submitted_at || e.created_at, score });
    }
  }

  return Array.from(personData.entries())
    .map(([name, scored]) => ({ name, points: groupByWeek(scored) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMaterialTypeEvolution(startDate?: string, endDate?: string): Promise<MaterialTypeEvolution[]> {
  const { evals, projectMap } = await fetchEvaluationsAndProjects(startDate, endDate);

  const typeData = new Map<string, { date: string; score: number }[]>();

  for (const e of evals) {
    const proj = e.project_id ? projectMap.get(e.project_id) : null;
    const matType = proj?.material_type || "Outros";
    const score = ((e.copy_score || 0) + (e.design_score || 0)) / ((e.copy_score ? 1 : 0) + (e.design_score ? 1 : 0) || 1);

    if (!typeData.has(matType)) typeData.set(matType, []);
    typeData.get(matType)!.push({ date: e.submitted_at || e.created_at, score });
  }

  return Array.from(typeData.entries())
    .map(([type, scored]) => ({ type, points: groupByWeek(scored) }))
    .sort((a, b) => a.type.localeCompare(b.type));
}

export async function getSquadComparison(startDate?: string, endDate?: string): Promise<SquadComparison[]> {
  const { evals, projectMap } = await fetchEvaluationsAndProjects(startDate, endDate);

  const squadAcc = new Map<string, { copyTotal: number; copyCount: number; designTotal: number; designCount: number }>();

  for (const e of evals) {
    const proj = e.project_id ? projectMap.get(e.project_id) : null;
    const squad = proj?.squad || "Sem squad";

    if (!squadAcc.has(squad)) squadAcc.set(squad, { copyTotal: 0, copyCount: 0, designTotal: 0, designCount: 0 });
    const acc = squadAcc.get(squad)!;
    if (e.copy_score != null) { acc.copyTotal += e.copy_score; acc.copyCount++; }
    if (e.design_score != null) { acc.designTotal += e.design_score; acc.designCount++; }
  }

  return Array.from(squadAcc.entries())
    .map(([squad, acc]) => {
      const avgCopy = acc.copyCount ? Math.round((acc.copyTotal / acc.copyCount) * 10) / 10 : 0;
      const avgDesign = acc.designCount ? Math.round((acc.designTotal / acc.designCount) * 10) / 10 : 0;
      const totalCount = acc.copyCount + acc.designCount;
      const avgTotal = totalCount ? Math.round(((acc.copyTotal + acc.designTotal) / totalCount) * 10) / 10 : 0;
      return { squad, avgCopy, avgDesign, avgTotal, count: Math.max(acc.copyCount, acc.designCount) };
    })
    .sort((a, b) => b.avgTotal - a.avgTotal);
}
