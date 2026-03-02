// Approval Data Service — Supabase-backed persistence
// All functions are async and query the real database.
import { supabase } from "@/integrations/supabase/client";
import { getActiveCreators, getUserSquadByName } from "@/utils/getActiveUsers";

// ─── Interfaces (preserved for compatibility) ─────────

export interface ApprovalJobData {
  id: string;
  title: string;
  client_name: string | null;
  responsible_user_id: string | null;
  responsible_name: string;
  status: "rascunho" | "para_aprovacao" | "em_ajustes" | "aprovado" | "arquivado" | "deletado";
  material_type: "estaticos" | "videos" | "landing_page" | "carrossel";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  position: number;
  share_token: string;
  [key: string]: any;
}

export interface ApprovalVersion {
  id: string;
  job_id: string;
  version_number: number;
  lp_url: string | null;
  art_rating: number | null;
  copy_rating: number | null;
  designer_id: string;
  designer_name: string;
  copywriter_id: string;
  copywriter_name: string;
  created_at: string;
  status: "pendente" | "aprovada" | "rejeitada";
}

export interface ApprovalAsset {
  id: string;
  version_id: string;
  job_id: string;
  type: "imagem" | "video" | "landing_page";
  url: string;
  file_name: string;
  created_at: string;
}

export interface ApprovalClientFeedback {
  id: string;
  job_id: string;
  client_name: string;
  copy_rating: number;
  copy_comment: string;
  design_rating: number;
  design_comment: string;
  approval_status: "aprovado" | "em_ajustes";
  submitted_at: string;
  version_number?: number;
  per_creative?: Array<{
    creative_index: number;
    copy_rating: number;
    copy_comment: string;
    design_rating: number;
    design_comment: string;
    status: "aprovado" | "em_ajustes";
  }>;
}

export interface CreativeSnapshot {
  creative_index: number;
  feed_file: any | null;
  story_file: any | null;
  caption: string | null;
}

export interface CreativeEvaluation {
  creative_index: number;
  copy_rating: number;
  copy_comment: string;
  design_rating: number;
  design_comment: string;
  decision: "aprovado" | "em_ajustes";
  decided_at: string;
}

export interface MaterialCreativeState {
  creativeIndex: number;
  finalDecision: "PENDING" | "APPROVED";
  approvedAtVersion?: number;
  approvedAt?: string;
  locked: boolean;
}

export interface SentVersionRecord {
  versionNumber: number;
  sentAt: string;
  creativeIndices: number[];
}

export interface ApprovalContentVersion {
  version_number: number;
  created_at: string;
  snapshot: {
    files: any[];
    caption: string | null;
    material_type: string;
    creatives?: CreativeSnapshot[];
    static_creative_count?: number;
    static_captions?: Record<number, string>;
    landing_page_link?: string | null;
  };
  feedback: {
    copy_rating: number;
    copy_comment: string;
    design_rating: number;
    design_comment: string;
    client_name: string;
    status_at_feedback: string;
    per_creative?: CreativeEvaluation[];
  };
}

export interface SquadRankingEntry {
  position: number;
  squad: string;
  approved: number;
  avgRating: number;
  materialsEvaluated: number;
  lowSample: boolean;
}

export interface OfficialRatings {
  copyRating: number;
  designRating: number;
  perCreative?: Record<number, { copyRating: number; designRating: number }>;
}

export interface ClientRankingEntry {
  position: number;
  clientName: string;
  avgRating: number;
  totalReviews: number;
}

// ─── Helper: map DB row to ApprovalJobData ────────────

function rowToJob(row: any): ApprovalJobData {
  return {
    id: row.id,
    title: row.title || row.name || "Sem título",
    client_name: row.client_name,
    responsible_user_id: row.responsible_user_id,
    responsible_name: row.responsible_name || "—",
    status: row.status || "rascunho",
    material_type: row.material_type || row.type || "estaticos",
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    position: row.position || 0,
    share_token: row.share_token || row.id,
    // Extra fields
    description: row.description,
    caption: row.caption,
    copy_text: row.copy_text,
    campaign_name: row.campaign_name,
    designer_name: row.designer_name,
    copywriter_name: row.copywriter_name,
    squad: row.squad,
    squad_source: row.squad_source || "auto",
    landing_page_link: row.landing_page_link,
    creation_date: row.creation_date,
    sent_for_approval_at: row.sent_for_approval_at,
    attached_files: row.attached_files || [],
    static_creative_count: row.static_creative_count || 1,
    static_captions: row.static_captions || {},
    static_files_data: row.static_files_data || {},
    video_count: row.video_count || 1,
    video_files_data: row.video_files_data || {},
    video_captions: row.video_captions || {},
    video_notes: row.video_notes || {},
    pending_creative_indices: row.pending_creative_indices || [],
    format: row.format,
  };
}

// ─── Public API ────────────────────────────────────────

export async function getJobs(filters?: {
  responsible?: string;
  client?: string;
  squad?: string;
  creator?: string;
  materialType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<ApprovalJobData[]> {
  let query = supabase.from("projects").select("*").order("position", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.not("status", "in", '("arquivado","deletado")');
  }

  if (filters?.client && filters.client !== "all") {
    query = query.eq("client_name", filters.client);
  }
  if (filters?.materialType && filters.materialType !== "all") {
    query = query.eq("material_type", filters.materialType);
  }
  if (filters?.startDate) {
    query = query.gte("start_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("end_date", filters.endDate);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  let result = (data || []).map(rowToJob);

  // Client-side filters that can't be done in SQL easily
  if (filters?.squad && filters.squad !== "all") {
    result = result.filter(j => {
      if (j.squad) return j.squad === filters.squad;
      const copSquad = j.copywriter_name ? getUserSquadByName(j.copywriter_name) : null;
      const desSquad = j.designer_name ? getUserSquadByName(j.designer_name) : null;
      return (copSquad || desSquad) === filters.squad;
    });
  }

  if (filters?.creator) {
    result = result.filter(j =>
      j.responsible_name === filters.creator ||
      j.designer_name === filters.creator ||
      j.copywriter_name === filters.creator
    );
  }

  return result;
}

export async function getVersions(jobId?: string): Promise<ApprovalVersion[]> {
  let query = supabase.from("materials").select("*").order("version_number", { ascending: true });
  if (jobId) query = query.eq("project_id", jobId);
  const { data } = await query;
  return (data || []).map((row: any) => ({
    id: row.id,
    job_id: row.project_id,
    version_number: row.version_number,
    lp_url: null,
    art_rating: null,
    copy_rating: null,
    designer_id: "",
    designer_name: row.designer_name || "",
    copywriter_id: "",
    copywriter_name: row.copywriter_name || "",
    created_at: row.created_at,
    status: row.status === "approved" ? "aprovada" : "pendente",
  }));
}

export async function getAssets(filters?: { jobId?: string; type?: string }): Promise<ApprovalAsset[]> {
  // Files are stored in material_files and referenced via projects.attached_files
  return [];
}

export async function getUniqueClients(): Promise<string[]> {
  const { data } = await supabase.from("projects").select("client_name");
  const names = (data || []).map((r: any) => r.client_name).filter(Boolean) as string[];
  return [...new Set(names)].sort();
}

export async function getResponsibles(): Promise<{ value: string; label: string }[]> {
  const { data } = await supabase.from("projects").select("responsible_user_id, responsible_name");
  const map = new Map<string, string>();
  (data || []).forEach((r: any) => {
    if (r.responsible_user_id) map.set(r.responsible_user_id, r.responsible_name || "");
  });
  return Array.from(map, ([value, label]) => ({ value, label }));
}

export async function getCreators(): Promise<string[]> {
  const { data } = await supabase.from("projects").select("designer_name, copywriter_name");
  const names = new Set<string>();
  (data || []).forEach((r: any) => {
    if (r.designer_name) names.add(r.designer_name);
    if (r.copywriter_name) names.add(r.copywriter_name);
  });
  return [...names].sort();
}

// ─── KPI computations ─────────────────────────────────

export async function computeKPIs(filters?: Parameters<typeof getJobs>[0]) {
  const jobs = await getJobs(filters);
  const pendentes = jobs.filter(j => j.status === "para_aprovacao").length;
  const emAjustes = jobs.filter(j => j.status === "em_ajustes").length;
  const aprovados = jobs.filter(j => j.status === "aprovado").length;
  const total = jobs.length;

  // Get evaluations for rated jobs
  const jobIds = jobs.map(j => j.id);
  let avgRating = 0;
  if (jobIds.length > 0) {
    const { data: evals } = await supabase
      .from("evaluations")
      .select("copy_score, design_score, project_id")
      .in("project_id", jobIds)
      .eq("is_official", true);

    if (evals && evals.length > 0) {
      let totalRating = 0;
      let ratingCount = 0;
      evals.forEach((e: any) => {
        const ratings: number[] = [];
        if (e.copy_score) ratings.push(Number(e.copy_score));
        if (e.design_score) ratings.push(Number(e.design_score));
        if (ratings.length > 0) {
          totalRating += ratings.reduce((s, r) => s + r, 0) / ratings.length;
          ratingCount++;
        }
      });
      avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    }
  }

  const squadRanking = await computeSquadRanking();
  const squadHighlight = squadRanking.length > 0
    ? { squad: squadRanking[0].squad, avgRating: squadRanking[0].avgRating }
    : { squad: "—", avgRating: 0 };

  // Compute previous period avg rating for trend arrow
  let avgRatingTrend: "up" | "down" | "stable" | null = null;
  if (filters?.startDate && filters?.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1); // day before current start
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    const prevFilters = { ...filters, startDate: prevStart.toISOString().slice(0, 10), endDate: prevEnd.toISOString().slice(0, 10) };
    const prevJobs = await getJobs(prevFilters);
    const prevJobIds = prevJobs.map(j => j.id);
    let prevAvgRating = 0;
    if (prevJobIds.length > 0) {
      const { data: prevEvals } = await supabase
        .from("evaluations")
        .select("copy_score, design_score, project_id")
        .in("project_id", prevJobIds)
        .eq("is_official", true);
      if (prevEvals && prevEvals.length > 0) {
        let pTotal = 0; let pCount = 0;
        prevEvals.forEach((e: any) => {
          const r: number[] = [];
          if (e.copy_score) r.push(Number(e.copy_score));
          if (e.design_score) r.push(Number(e.design_score));
          if (r.length > 0) { pTotal += r.reduce((s, v) => s + v, 0) / r.length; pCount++; }
        });
        prevAvgRating = pCount > 0 ? pTotal / pCount : 0;
      }
    }
    if (prevAvgRating > 0 && avgRating > 0) {
      const diff = avgRating - prevAvgRating;
      avgRatingTrend = diff > 0.05 ? "up" : diff < -0.05 ? "down" : "stable";
    }
  }

  return { pendentes, emAjustes, aprovados, total, avgRating, avgRatingTrend, squadHighlight };
}

// ─── Unified Ranking ──────────────────────────────────

export async function computeUnifiedRanking(filters?: Parameters<typeof getJobs>[0]): Promise<{
  position: number; name: string; materialsEvaluated: number; avgRating: number;
}[]> {
  const jobs = await getJobs();
  const jobIds = jobs.map(j => j.id);

  const { data: evals } = jobIds.length > 0
    ? await supabase.from("evaluations").select("*").in("project_id", jobIds).eq("is_official", true)
    : { data: [] };

  const evalsByJob = new Map<string, any>();
  (evals || []).forEach((e: any) => {
    if (!evalsByJob.has(e.project_id)) evalsByJob.set(e.project_id, e);
  });

  const map = new Map<string, { name: string; totalRating: number; count: number }>();

  jobs.forEach(job => {
    const ev = evalsByJob.get(job.id);
    const designRating = ev?.design_score ? Number(ev.design_score) : null;
    const copyRating = ev?.copy_score ? Number(ev.copy_score) : null;

    if (job.designer_name && designRating) {
      const entry = map.get(job.designer_name) || { name: job.designer_name, totalRating: 0, count: 0 };
      entry.totalRating += designRating;
      entry.count++;
      map.set(job.designer_name, entry);
    }
    if (job.copywriter_name && copyRating) {
      const entry = map.get(job.copywriter_name) || { name: job.copywriter_name, totalRating: 0, count: 0 };
      entry.totalRating += copyRating;
      entry.count++;
      map.set(job.copywriter_name, entry);
    }
  });

  const registeredCreators = getActiveCreators();
  registeredCreators.forEach(name => {
    if (!map.has(name)) map.set(name, { name, totalRating: 0, count: 0 });
  });

  return Array.from(map.values())
    .map(e => ({
      position: 0,
      name: e.name,
      materialsEvaluated: e.count,
      avgRating: e.count > 0 ? e.totalRating / e.count : 0,
    }))
    .sort((a, b) => b.avgRating - a.avgRating || b.materialsEvaluated - a.materialsEvaluated || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, position: i + 1 }));
}

// ─── Squad Ranking ────────────────────────────────────

export async function computeSquadRanking(_filters?: Parameters<typeof getJobs>[0]): Promise<SquadRankingEntry[]> {
  const jobs = await getJobs();
  const jobIds = jobs.map(j => j.id);

  const { data: evals } = jobIds.length > 0
    ? await supabase.from("evaluations").select("*").in("project_id", jobIds).eq("is_official", true)
    : { data: [] };

  const evalsByJob = new Map<string, any>();
  (evals || []).forEach((e: any) => {
    if (!evalsByJob.has(e.project_id)) evalsByJob.set(e.project_id, e);
  });

  const squadMap = new Map<string, { totalRating: number; evaluatedCount: number; approvedCount: number }>();

  jobs.forEach(job => {
    let squad: string | null = job.squad || null;
    if (!squad) {
      const copSquad = job.copywriter_name ? getUserSquadByName(job.copywriter_name) : null;
      const desSquad = job.designer_name ? getUserSquadByName(job.designer_name) : null;
      squad = copSquad || desSquad || null;
    }
    if (!squad) return;

    if (!squadMap.has(squad)) squadMap.set(squad, { totalRating: 0, evaluatedCount: 0, approvedCount: 0 });
    const entry = squadMap.get(squad)!;

    if (job.status === "aprovado") entry.approvedCount++;

    const ev = evalsByJob.get(job.id);
    const copyRating = ev?.copy_score ? Number(ev.copy_score) : null;
    const designRating = ev?.design_score ? Number(ev.design_score) : null;
    const ratings: number[] = [];
    if (copyRating) ratings.push(copyRating);
    if (designRating) ratings.push(designRating);
    if (ratings.length > 0) {
      entry.totalRating += ratings.reduce((s, r) => s + r, 0) / ratings.length;
      entry.evaluatedCount++;
    }
  });

  return Array.from(squadMap.entries())
    .map(([squad, data]) => ({
      position: 0,
      squad,
      approved: data.approvedCount,
      avgRating: data.evaluatedCount > 0 ? data.totalRating / data.evaluatedCount : 0,
      materialsEvaluated: data.evaluatedCount,
      lowSample: data.evaluatedCount < 2,
    }))
    .sort((a, b) => b.avgRating - a.avgRating || b.materialsEvaluated - a.materialsEvaluated || a.squad.localeCompare(b.squad))
    .map((e, i) => ({ ...e, position: i + 1 }));
}

export async function getApprovedVersionsStats(filters?: Parameters<typeof getJobs>[0]) {
  const kpis = await computeKPIs(filters);
  return { count: kpis.aprovados, avgRating: kpis.avgRating, squadStats: [] };
}

export async function computeOverallAvgRating(filters?: Parameters<typeof getJobs>[0]): Promise<number> {
  return (await getApprovedVersionsStats(filters)).avgRating;
}

export async function computeSquadHighlight(filters?: Parameters<typeof getJobs>[0]): Promise<{ squad: string; avgRating: number }> {
  const squadRanking = await computeSquadRanking(filters);
  if (squadRanking.length === 0) return { squad: "—", avgRating: 0 };
  return { squad: squadRanking[0].squad, avgRating: squadRanking[0].avgRating };
}

export async function computeDesignerRanking(filters?: Parameters<typeof getJobs>[0]) {
  const ranking = await computeUnifiedRanking(filters);
  return ranking; // Unified ranking includes both designers and copywriters
}

export async function computeCopywriterRanking(filters?: Parameters<typeof getJobs>[0]) {
  return computeDesignerRanking(filters);
}

// ─── Client Ranking ───────────────────────────────────

export async function computeClientRanking(filters?: Parameters<typeof getJobs>[0]): Promise<ClientRankingEntry[]> {
  const jobs = await getJobs(filters);
  const jobIds = jobs.map(j => j.id);

  if (jobIds.length === 0) return [];

  const { data: evals } = await supabase
    .from("evaluations")
    .select("copy_score, design_score, project_id")
    .in("project_id", jobIds)
    .eq("is_official", true);

  // Map evaluations to their project's client_name
  const jobClientMap = new Map<string, string>();
  jobs.forEach(j => {
    if (j.client_name) jobClientMap.set(j.id, j.client_name);
  });

  const clientMap = new Map<string, { totalRating: number; count: number }>();

  (evals || []).forEach((e: any) => {
    const clientName = jobClientMap.get(e.project_id);
    if (!clientName) return;

    const ratings: number[] = [];
    if (e.copy_score) ratings.push(Number(e.copy_score));
    if (e.design_score) ratings.push(Number(e.design_score));
    if (ratings.length === 0) return;

    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const entry = clientMap.get(clientName) || { totalRating: 0, count: 0 };
    entry.totalRating += avg;
    entry.count++;
    clientMap.set(clientName, entry);
  });

  return Array.from(clientMap.entries())
    .map(([clientName, data]) => ({
      position: 0,
      clientName,
      avgRating: data.count > 0 ? data.totalRating / data.count : 0,
      totalReviews: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews)
    .map((e, i) => ({ ...e, position: i + 1 }));
}

// ─── CRUD operations ─────────────────────────────────

export async function updateJobStatus(jobId: string, status: ApprovalJobData["status"]) {
  const { error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) console.error("Error updating job status:", error);
}

export async function createJob(partial: Partial<ApprovalJobData> & Record<string, any>): Promise<ApprovalJobData> {
  const now = new Date().toISOString();
  const row = {
    name: partial.title || partial.campaign_name || "Novo Job",
    title: partial.title || partial.campaign_name || "Novo Job",
    client_name: partial.client_name || null,
    responsible_user_id: partial.responsible_user_id || null,
    responsible_name: partial.responsible_name || "—",
    status: partial.status || "rascunho",
    type: partial.material_type || "estaticos",
    material_type: partial.material_type || "estaticos",
    start_date: now,
    created_at: now,
    updated_at: now,
    position: partial.position || 0,
    description: partial.description || null,
    caption: partial.caption || null,
    landing_page_link: partial.landing_page_link || null,
    creation_date: partial.creation_date || now.split("T")[0],
    squad: partial.squad || null,
    squad_source: partial.squad_source || "auto",
    attached_files: partial.attached_files || [],
    sent_for_approval_at: partial.status === "para_aprovacao" ? now : null,
    designer_name: partial.designer_name || null,
    copywriter_name: partial.copywriter_name || null,
    campaign_name: partial.campaign_name || null,
    static_creative_count: partial.static_creative_count || 1,
    static_captions: partial.static_captions || {},
    static_files_data: partial.static_files_data || {},
    video_count: partial.video_count || 1,
    video_files_data: partial.video_files_data || {},
    video_captions: partial.video_captions || {},
    video_notes: partial.video_notes || {},
    pending_creative_indices: partial.pending_creative_indices || [],
  };

  const { data, error } = await supabase.from("projects").insert(row).select().single();
  if (error) {
    console.error("Error creating job:", error);
    return { ...row, id: crypto.randomUUID(), share_token: crypto.randomUUID() } as any;
  }
  return rowToJob(data);
}

export async function updateJob(jobId: string, updates: Partial<ApprovalJobData> & Record<string, any>): Promise<ApprovalJobData | null> {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };
  // Don't send id/created_at in updates
  delete updateData.id;
  delete updateData.created_at;

  if (updates.status === "para_aprovacao" && !updates.sent_for_approval_at) {
    updateData.sent_for_approval_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("projects").update(updateData).eq("id", jobId).select().single();
  if (error) {
    console.error("Error updating job:", error);
    return null;
  }
  return rowToJob(data);
}

export async function deleteJob(jobId: string) {
  const { error } = await supabase.from("projects").delete().eq("id", jobId);
  if (error) console.error("Error deleting job:", error);
}

// ─── Client Feedback ──────────────────────────────────

export async function submitClientFeedback(params: {
  jobId: string;
  clientName: string;
  copyRating: number;
  copyComment: string;
  designRating: number;
  designComment: string;
  status: "aprovado" | "em_ajustes";
  perCreative?: Array<{
    creative_index: number;
    copy_rating: number;
    copy_comment: string;
    design_rating: number;
    design_comment: string;
    status: "aprovado" | "em_ajustes";
  }>;
}) {
  const now = new Date().toISOString();

  // Determine version number from existing evaluations
  const { data: existingEvals } = await supabase
    .from("evaluations")
    .select("version_number")
    .eq("project_id", params.jobId)
    .order("version_number", { ascending: false })
    .limit(1);

  const versionNumber = (existingEvals && existingEvals.length > 0)
    ? (existingEvals[0].version_number || 0) + 1
    : 1;

  // Check if this is the first evaluation (official)
  const isOfficial = versionNumber === 1;

  const evalRow = {
    project_id: params.jobId,
    version_number: versionNumber,
    copy_score: params.copyRating,
    design_score: params.designRating,
    feedback_copy: params.copyComment,
    feedback_design: params.designComment,
    copy_comment: params.copyComment,
    design_comment: params.designComment,
    is_official: isOfficial,
    client_name: params.clientName,
    approval_status: params.status,
    status: params.status,
    submitted_at: now,
    per_creative: params.perCreative || null,
  };

  const { data: inserted, error } = await (supabase as any).from("evaluations").insert(evalRow).select().single();
  if (error) console.error("Error submitting feedback:", error);

  // Update job status
  if (params.perCreative && params.perCreative.length > 0) {
    const hasAdjustment = params.perCreative.some(pc => pc.status === "em_ajustes");
    const allApproved = params.perCreative.every(pc => pc.status === "aprovado");
    if (allApproved) {
      await updateJobStatus(params.jobId, "aprovado");
      await updateJob(params.jobId, { pending_creative_indices: [] });
    } else {
      await updateJobStatus(params.jobId, "em_ajustes");
      const pendingIndices = params.perCreative
        .filter(pc => pc.status !== "aprovado")
        .map(pc => pc.creative_index);
      await updateJob(params.jobId, { pending_creative_indices: pendingIndices });
    }
  } else {
    await updateJobStatus(params.jobId, params.status);
  }

  return inserted || { id: crypto.randomUUID(), ...evalRow };
}

export async function getClientFeedback(jobId: string): Promise<ApprovalClientFeedback[]> {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("project_id", jobId)
    .order("submitted_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    job_id: row.project_id,
    client_name: row.client_name || "Cliente",
    copy_rating: Number(row.copy_score) || 0,
    copy_comment: row.copy_comment || row.feedback_copy || "",
    design_rating: Number(row.design_score) || 0,
    design_comment: row.design_comment || row.feedback_design || "",
    approval_status: row.approval_status || row.status || "em_ajustes",
    submitted_at: row.submitted_at || row.created_at,
    version_number: row.version_number,
    per_creative: row.per_creative || undefined,
  }));
}

// ─── Creative States ──────────────────────────────────
// Creative states are now derived from evaluations data

export async function getCreativeStates(jobId: string): Promise<MaterialCreativeState[]> {
  const feedback = await getClientFeedback(jobId);
  if (feedback.length === 0) return [];

  const stateMap = new Map<number, MaterialCreativeState>();

  // Process all feedback in chronological order
  const sorted = [...feedback].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
  sorted.forEach(fb => {
    if (fb.per_creative) {
      fb.per_creative.forEach(pc => {
        if (pc.status === "aprovado") {
          stateMap.set(pc.creative_index, {
            creativeIndex: pc.creative_index,
            finalDecision: "APPROVED",
            approvedAtVersion: fb.version_number,
            approvedAt: fb.submitted_at,
            locked: true,
          });
        } else if (!stateMap.has(pc.creative_index) || stateMap.get(pc.creative_index)!.finalDecision !== "APPROVED") {
          stateMap.set(pc.creative_index, {
            creativeIndex: pc.creative_index,
            finalDecision: "PENDING",
            locked: false,
          });
        }
      });
    }
  });

  return Array.from(stateMap.values());
}

export async function initCreativeStates(jobId: string, count: number) {
  // No-op: creative states are now derived from evaluations
}

// ─── Sent Versions ────────────────────────────────────
// Sent versions are now derived from materials table

export async function getSentVersions(jobId: string): Promise<SentVersionRecord[]> {
  const { data } = await supabase
    .from("materials")
    .select("*")
    .eq("project_id", jobId)
    .order("version_number", { ascending: true });

  return (data || []).map((row: any) => ({
    versionNumber: row.version_number,
    sentAt: row.created_at,
    creativeIndices: [],
  }));
}

export async function createSentVersion(jobId: string): Promise<SentVersionRecord> {
  // Get next version number
  const { data: existing } = await supabase
    .from("materials")
    .select("version_number")
    .eq("project_id", jobId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextNum = (existing && existing.length > 0) ? existing[0].version_number + 1 : 1;

  // Deactivate previous versions
  await supabase
    .from("materials")
    .update({ is_active_version: false })
    .eq("project_id", jobId);

  const { data: inserted } = await supabase
    .from("materials")
    .insert({
      project_id: jobId,
      version_number: nextNum,
      status: "sent",
      is_active_version: true,
    })
    .select()
    .single();

  return {
    versionNumber: nextNum,
    sentAt: inserted?.created_at || new Date().toISOString(),
    creativeIndices: [],
  };
}

// ─── Content Versions ─────────────────────────────────

export async function getContentVersions(jobId: string): Promise<ApprovalContentVersion[]> {
  // Reconstruct content versions from evaluations + project data
  const feedback = await getClientFeedback(jobId);
  if (feedback.length === 0) return [];

  const { data: project } = await supabase.from("projects").select("*").eq("id", jobId).single();

  const sorted = [...feedback].sort((a, b) => (a.version_number || 1) - (b.version_number || 1));

  return sorted.map((fb): ApprovalContentVersion => ({
    version_number: fb.version_number || 1,
    created_at: fb.submitted_at,
    snapshot: {
      files: (project?.attached_files as any[]) || [],
      caption: (project?.caption as string) || null,
      material_type: (project?.material_type as string) || "estaticos",
      landing_page_link: (project?.landing_page_link as string) || null,
      static_creative_count: (project?.static_creative_count as number) || undefined,
      static_captions: (project?.static_captions as Record<number, string>) || undefined,
    },
    feedback: {
      copy_rating: fb.copy_rating,
      copy_comment: fb.copy_comment,
      design_rating: fb.design_rating,
      design_comment: fb.design_comment,
      client_name: fb.client_name,
      status_at_feedback: fb.approval_status,
      per_creative: fb.per_creative?.map(pc => ({
        creative_index: pc.creative_index,
        copy_rating: pc.copy_rating,
        copy_comment: pc.copy_comment,
        design_rating: pc.design_rating,
        design_comment: pc.design_comment,
        decision: pc.status,
        decided_at: fb.submitted_at,
      })),
    },
  }));
}

// ─── Official Ratings ─────────────────────────────────

export async function getOfficialRatings(jobId: string): Promise<OfficialRatings | null> {
  const { data } = await supabase
    .from("evaluations")
    .select("*")
    .eq("project_id", jobId)
    .eq("is_official", true)
    .limit(1)
    .single();

  if (!data) return null;

  const result: OfficialRatings = {
    copyRating: Number(data.copy_score) || 0,
    designRating: Number(data.design_score) || 0,
  };

  if (data.per_creative) {
    result.perCreative = {};
    (data.per_creative as any[]).forEach(pc => {
      result.perCreative![pc.creative_index] = {
        copyRating: pc.copy_rating,
        designRating: pc.design_rating,
      };
    });
  }

  return result;
}

// ─── Share Token ──────────────────────────────────────

export async function getJobByShareToken(shareToken: string): Promise<any | null> {
  const { data: job } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", shareToken)
    .single();

  if (!job) return null;

  const mapped = rowToJob(job);
  const states = await getCreativeStates(job.id);
  const sentVersions = await getSentVersions(job.id);
  const officialRatings = await getOfficialRatings(job.id);
  const latestSent = sentVersions.length > 0 ? sentVersions[sentVersions.length - 1] : null;

  const isStatic = mapped.material_type === "estaticos";
  const isVideo = mapped.material_type === "videos";
  const staticCount = mapped.static_creative_count || 1;
  const videoCount = mapped.video_count || 1;
  const itemCount = isStatic ? staticCount : isVideo ? videoCount : 1;

  let pendingIndices: number[];
  if (states.length > 0) {
    pendingIndices = states.filter(s => s.finalDecision === "PENDING").map(s => s.creativeIndex);
  } else {
    pendingIndices = Array.from({ length: itemCount }, (_, i) => i);
  }

  return {
    ...mapped,
    pending_creative_indices: pendingIndices,
    current_version_number: latestSent?.versionNumber || 1,
    official_ratings: officialRatings,
  };
}
