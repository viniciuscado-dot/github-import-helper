// Approval Data Service — 100% mock, persisted in localStorage
// Entities: Job, Version, Approval, Asset
import { getActiveCreators, getUserSquadByName } from "@/utils/getActiveUsers";

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
}

export interface ApprovalVersion {
  id: string;
  job_id: string;
  version_number: number;
  lp_url: string | null;
  art_rating: number | null;   // 1–5
  copy_rating: number | null;  // 1–5
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
  // Per-creative feedback for static materials
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

// Canonical per-creative approval state across versions
export interface MaterialCreativeState {
  creativeIndex: number;
  finalDecision: "PENDING" | "APPROVED";
  approvedAtVersion?: number;
  approvedAt?: string;
  locked: boolean;
}

// Sent version record (tracks each send/resend for approval)
export interface SentVersionRecord {
  versionNumber: number;
  sentAt: string;
  creativeIndices: number[]; // which creatives were included in this send
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

const STORAGE_KEY = "approval_data_service_v11";
const FEEDBACK_STORAGE_KEY = "approval_client_feedback_v5";
const VERSIONS_STORAGE_KEY = "approval_content_versions_v5";
const CREATIVE_STATES_KEY = "approval_creative_states_v5";
const SENT_VERSIONS_KEY = "approval_sent_versions_v5";

function generateId(): string {
  return "adm-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getSeedData() {
  const now = new Date().toISOString();
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

  const designers = [
    { id: "des-001", name: "Matheus Alves", squad: "Apollo" },
    { id: "des-002", name: "Sofia Rondon", squad: "Athena" },
    { id: "des-003", name: "Iris Castro", squad: "Ares" },
  ];
  const copywriters = [
    { id: "cop-001", name: "Elias Zappelini", squad: "Ártemis" },
    { id: "cop-002", name: "Eduardo Schefer", squad: "Ares" },
  ];
  const responsibles = [
    { id: "auth-mock-001", name: "Admin DOT" },
    { id: "auth-mock-002", name: "Vinícius Cadó" },
  ];

  const jobs: ApprovalJobData[] = [
    { id: "ajob-001", title: "Post Instagram - Ackno", client_name: "Ackno", responsible_user_id: "auth-mock-001", responsible_name: "Admin DOT", status: "rascunho", material_type: "estaticos", start_date: daysAgo(5), end_date: null, created_at: daysAgo(5), updated_at: now, position: 0, share_token: "st-001", squad: "Apollo", squad_source: "manual" } as any,
    { id: "ajob-002", title: "Campanha Google - Connect Tecnologia", client_name: "Connect Tecnologia", responsible_user_id: "auth-mock-002", responsible_name: "Vinícius Cadó", status: "para_aprovacao", material_type: "carrossel", start_date: daysAgo(10), end_date: null, created_at: daysAgo(10), updated_at: now, position: 1, share_token: "st-002", squad: "Athena", squad_source: "manual" } as any,
    { id: "ajob-003", title: "Stories Semanal - Itiban", client_name: "Itiban", responsible_user_id: "auth-mock-001", responsible_name: "Admin DOT", status: "em_ajustes", material_type: "estaticos", start_date: daysAgo(15), end_date: null, created_at: daysAgo(15), updated_at: now, position: 2, share_token: "st-003", squad: "Ares", squad_source: "manual" } as any,
    { id: "ajob-004", title: "Banner Site - Paragon", client_name: "Paragon", responsible_user_id: "auth-mock-001", responsible_name: "Admin DOT", status: "aprovado", material_type: "estaticos", start_date: daysAgo(20), end_date: daysAgo(2), created_at: daysAgo(20), updated_at: daysAgo(2), position: 3, share_token: "st-004", squad: "Apollo", squad_source: "manual" } as any,
    { id: "ajob-005", title: "Reels Mensal - Café da Fazenda", client_name: "Café da Fazenda", responsible_user_id: "auth-mock-002", responsible_name: "Vinícius Cadó", status: "aprovado", material_type: "videos", start_date: daysAgo(12), end_date: daysAgo(1), created_at: daysAgo(12), updated_at: daysAgo(1), position: 4, share_token: "st-005", squad: "Athena", squad_source: "manual" } as any,
    { id: "ajob-006", title: "LP Promo Verão - Sul Solar", client_name: "Sul Solar", responsible_user_id: "auth-mock-001", responsible_name: "Admin DOT", status: "aprovado", material_type: "landing_page", start_date: daysAgo(25), end_date: daysAgo(5), created_at: daysAgo(25), updated_at: daysAgo(5), position: 5, share_token: "st-006", squad: "Ares", squad_source: "manual" } as any,
    { id: "ajob-007", title: "Vídeo Institucional - Lebes", client_name: "Lebes", responsible_user_id: "auth-mock-002", responsible_name: "Vinícius Cadó", status: "para_aprovacao", material_type: "videos", start_date: daysAgo(3), end_date: null, created_at: daysAgo(3), updated_at: now, position: 6, share_token: "st-007", squad: "Ártemis", squad_source: "manual" } as any,
    { id: "ajob-008", title: "Carrossel Educativo - Huli", client_name: "Huli", responsible_user_id: "auth-mock-002", responsible_name: "Vinícius Cadó", status: "aprovado", material_type: "carrossel", start_date: daysAgo(8), end_date: daysAgo(1), created_at: daysAgo(8), updated_at: daysAgo(1), position: 7, share_token: "st-008", squad: "Ártemis", squad_source: "manual" } as any,
    { id: "ajob-009", title: "Post LinkedIn - NEO", client_name: "NEO", responsible_user_id: "auth-mock-001", responsible_name: "Admin DOT", status: "aprovado", material_type: "estaticos", start_date: daysAgo(18), end_date: daysAgo(3), created_at: daysAgo(18), updated_at: daysAgo(3), position: 8, share_token: "st-009", squad: "Apollo", squad_source: "manual" } as any,
    { id: "ajob-010", title: "Story Promo - Linx", client_name: "Linx", responsible_user_id: "auth-mock-001", responsible_name: "Admin DOT", status: "aprovado", material_type: "estaticos", start_date: daysAgo(14), end_date: daysAgo(4), created_at: daysAgo(14), updated_at: daysAgo(4), position: 9, share_token: "st-010", squad: "Ares", squad_source: "manual" } as any,
  ];

  // Designer/copywriter assignments aligned with job squads
  // Apollo → Matheus Alves (des-001), Athena → Sofia Rondon (des-002), Ares → Iris Castro (des-003)
  const approvedAssignments: Record<string, { designer: typeof designers[0]; copywriter: typeof copywriters[0] }> = {
    "ajob-004": { designer: designers[0], copywriter: copywriters[0] },  // Apollo: Matheus + Elias
    "ajob-005": { designer: designers[1], copywriter: copywriters[1] },  // Athena: Sofia + Eduardo
    "ajob-006": { designer: designers[2], copywriter: copywriters[0] },  // Ares: Iris + Elias
    "ajob-008": { designer: designers[1], copywriter: copywriters[1] },  // Ártemis: Sofia + Eduardo
    "ajob-009": { designer: designers[0], copywriter: copywriters[0] },  // Apollo: Matheus + Elias
    "ajob-010": { designer: designers[2], copywriter: copywriters[1] },  // Ares: Iris + Eduardo
  };

  const versions: ApprovalVersion[] = [];
  const assets: ApprovalAsset[] = [];

  jobs.forEach((job) => {
    const numVersions = job.status === "aprovado" ? 2 : 1;
    for (let v = 1; v <= numVersions; v++) {
      const isApproved = job.status === "aprovado" && v === numVersions;
      const assignment = approvedAssignments[job.id];
      // Use fixed assignment for approved versions, rotate for others
      const des = assignment && isApproved ? assignment.designer : designers[jobs.indexOf(job) % designers.length];
      const cop = assignment && isApproved ? assignment.copywriter : copywriters[jobs.indexOf(job) % copywriters.length];
      const vId = `ver-${job.id}-${v}`;
      versions.push({
        id: vId,
        job_id: job.id,
        version_number: v,
        lp_url: job.material_type === "landing_page" && isApproved ? `https://lp.example.com/${job.id}` : null,
        art_rating: isApproved ? [4, 5, 4, 3, 5, 4][Object.keys(approvedAssignments).indexOf(job.id)] || 4 : null,
        copy_rating: isApproved ? [3, 4, 5, 4, 3, 5][Object.keys(approvedAssignments).indexOf(job.id)] || 3 : null,
        designer_id: des.id,
        designer_name: des.name,
        copywriter_id: cop.id,
        copywriter_name: cop.name,
        created_at: job.created_at,
        status: isApproved ? "aprovada" : "pendente",
      });

      const assetType = job.material_type === "videos" ? "video" : job.material_type === "landing_page" ? "landing_page" : "imagem";
      assets.push({
        id: `asset-${vId}`,
        version_id: vId,
        job_id: job.id,
        type: assetType,
        url: `https://placeholder.example.com/${assetType}/${job.id}`,
        file_name: `${job.title}.${assetType === "video" ? "mp4" : assetType === "landing_page" ? "html" : "png"}`,
        created_at: job.created_at,
      });
    }
  });

  return { jobs, versions, assets };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReturnType<typeof getSeedData>;
  } catch { /* ignore */ }
  const seed = getSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveData(data: ReturnType<typeof getSeedData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Squad mapping ─────────────────────────────────────
const SQUAD_MAP: Record<string, string> = {
  "des-001": "Apollo",
  "des-002": "Athena",
  "des-003": "Ares",
  "cop-001": "Ártemis",
  "cop-002": "Ares",
};

// ─── Public API ────────────────────────────────────────

export function getJobs(filters?: {
  responsible?: string;
  client?: string;
  squad?: string;
  creator?: string;
  materialType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): ApprovalJobData[] {
  const data = loadData();
  // When no explicit status filter is set, exclude archived/deleted (they are not active Kanban materials)
  let result = (!filters?.status)
    ? data.jobs.filter(j => j.status !== "arquivado" && j.status !== "deletado")
    : data.jobs;

  if (filters?.responsible && filters.responsible !== "all") {
    result = result.filter(j => j.responsible_user_id === filters.responsible);
  }
  if (filters?.client && filters.client !== "all") {
    result = result.filter(j => j.client_name === filters.client);
  }
  if (filters?.squad && filters.squad !== "all") {
    // Resolve each job's single squad using SSOT priority:
    // 1. Manual override on job
    // 2. Copywriter's squad (from profile or static map)
    // 3. Designer's squad (from profile or static map)
    result = result.filter(j => {
      const jobAny = j as any;

      // If job has a manual squad override, use it directly
      if (jobAny.squad_source === "manual" && jobAny.squad) {
        return jobAny.squad === filters.squad;
      }

      // If job has an explicit squad (non-manual), use it
      if (jobAny.squad) {
        return jobAny.squad === filters.squad;
      }

      // Resolve from job-level people names
      const copSquadJob = jobAny.copywriter_name ? getUserSquadByName(jobAny.copywriter_name) : null;
      const desSquadJob = jobAny.designer_name ? getUserSquadByName(jobAny.designer_name) : null;
      const resolvedFromJob = copSquadJob || desSquadJob;
      if (resolvedFromJob) return resolvedFromJob === filters.squad;

      // Fallback: resolve from version-level data (seed data)
      const jobVersions = data.versions.filter(v => v.job_id === j.id);
      for (const v of jobVersions) {
        const copSquad = SQUAD_MAP[v.copywriter_id] || getUserSquadByName(v.copywriter_name);
        const desSquad = SQUAD_MAP[v.designer_id] || getUserSquadByName(v.designer_name);
        // SSOT priority: copywriter > designer
        const resolved = copSquad || desSquad;
        if (resolved) return resolved === filters.squad;
      }

      return false;
    });
  }
  if (filters?.creator) {
    // Match creator against responsible_name, designer_name, copywriter_name on job
    // Also check version-level assignments for seed data
    const creatorVersionJobIds = new Set(
      data.versions
        .filter(v => v.designer_name === filters.creator || v.copywriter_name === filters.creator)
        .map(v => v.job_id)
    );
    result = result.filter(j => {
      const jobAny = j as any;
      return j.responsible_name === filters.creator
        || jobAny.designer_name === filters.creator
        || jobAny.copywriter_name === filters.creator
        || creatorVersionJobIds.has(j.id);
    });
  }
  if (filters?.materialType && filters.materialType !== "all") {
    if (filters.materialType === "estaticos") {
      result = result.filter(j => j.material_type === "estaticos");
    } else if (filters.materialType === "videos") {
      result = result.filter(j => j.material_type === "videos");
    } else if (filters.materialType === "carrossel") {
      result = result.filter(j => j.material_type === "carrossel");
    } else if (filters.materialType === "landing_page") {
      result = result.filter(j => j.material_type === "landing_page");
    }
  }
  if (filters?.startDate) {
    result = result.filter(j => j.start_date && j.start_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    result = result.filter(j => j.end_date && j.end_date <= filters.endDate! || !j.end_date);
  }
  if (filters?.status) {
    result = result.filter(j => j.status === filters.status);
  }

  return result.sort((a, b) => a.position - b.position);
}

export function getVersions(jobId?: string): ApprovalVersion[] {
  const data = loadData();
  return jobId ? data.versions.filter(v => v.job_id === jobId) : data.versions;
}

export function getAssets(filters?: { jobId?: string; type?: string }): ApprovalAsset[] {
  const data = loadData();
  let result = data.assets;
  if (filters?.jobId) result = result.filter(a => a.job_id === filters.jobId);
  if (filters?.type) result = result.filter(a => a.type === filters.type);
  return result;
}

export function getUniqueClients(): string[] {
  // Merge clients from approval jobs + CRM cards for a complete list
  const data = loadData();
  const jobClients = data.jobs.map(j => j.client_name).filter(Boolean) as string[];
  
  // Also pull from CRM mock store
  let crmClients: string[] = [];
  try {
    const raw = localStorage.getItem('mock-supabase-db');
    if (raw) {
      const db = JSON.parse(raw);
      if (db.crm_cards) {
        crmClients = db.crm_cards
          .map((c: any) => c.company_name)
          .filter(Boolean);
      }
    }
  } catch { /* ignore */ }
  
  return [...new Set([...jobClients, ...crmClients])].sort();
}

export function getResponsibles(): { value: string; label: string }[] {
  const data = loadData();
  const map = new Map<string, string>();
  data.jobs.forEach(j => {
    if (j.responsible_user_id) map.set(j.responsible_user_id, j.responsible_name);
  });
  return Array.from(map, ([value, label]) => ({ value, label }));
}

export function getCreators(): string[] {
  const data = loadData();
  const names = new Set<string>();
  data.versions.forEach(v => {
    names.add(v.designer_name);
    names.add(v.copywriter_name);
  });
  return [...names].sort();
}

// ─── KPI computations ─────────────────────────────────
// SSOT: All KPIs derive from getJobs(filters) + V1 feedback

export function computeKPIs(filters?: Parameters<typeof getJobs>[0]) {
  const jobs = getJobs(filters);
  const filteredJobIds = new Set(jobs.map(j => j.id));

  // Status-based counts — same statuses as Kanban columns
  const pendentes = jobs.filter(j => j.status === "para_aprovacao").length;
  const emAjustes = jobs.filter(j => j.status === "em_ajustes").length;
  const aprovados = jobs.filter(j => j.status === "aprovado").length;
  const total = jobs.filter(j => j.status !== "arquivado" && j.status !== "deletado").length;

  // V1 ratings: prefer client feedback, fallback to version ratings
  const data = loadData();
  const allFeedback = loadFeedback();
  const v1FeedbackByJob = new Map<string, ApprovalClientFeedback>();
  allFeedback.forEach(f => {
    if (!filteredJobIds.has(f.job_id)) return;
    const vn = f.version_number || 1;
    if (vn !== 1) return;
    if (!v1FeedbackByJob.has(f.job_id)) {
      v1FeedbackByJob.set(f.job_id, f);
    }
  });

  // Find rated version per job (first version with ratings, preferring earlier versions)
  const ratedVersionByJob = new Map<string, ApprovalVersion>();
  const sortedVersions = [...data.versions].sort((a, b) => a.version_number - b.version_number);
  sortedVersions.forEach(v => {
    if (!filteredJobIds.has(v.job_id)) return;
    if (ratedVersionByJob.has(v.job_id)) return;
    if ((v.art_rating && v.art_rating > 0) || (v.copy_rating && v.copy_rating > 0)) {
      ratedVersionByJob.set(v.job_id, v);
    }
  });

  let totalRating = 0;
  let ratingCount = 0;
  // Use feedback first, then rated version ratings as fallback
  const allRatedJobIds = new Set([...v1FeedbackByJob.keys(), ...ratedVersionByJob.keys()]);
  allRatedJobIds.forEach(jobId => {
    if (!filteredJobIds.has(jobId)) return;
    const feedback = v1FeedbackByJob.get(jobId);
    const version = ratedVersionByJob.get(jobId);
    const copyRating = (feedback?.copy_rating && feedback.copy_rating > 0) ? feedback.copy_rating : (version?.copy_rating && version.copy_rating > 0 ? version.copy_rating : null);
    const designRating = (feedback?.design_rating && feedback.design_rating > 0) ? feedback.design_rating : (version?.art_rating && version.art_rating > 0 ? version.art_rating : null);
    const ratings: number[] = [];
    if (copyRating) ratings.push(copyRating);
    if (designRating) ratings.push(designRating);
    if (ratings.length > 0) {
      totalRating += ratings.reduce((s, r) => s + r, 0) / ratings.length;
      ratingCount++;
    }
  });
  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Squad highlight: always uses full dataset (rankings are filter-independent)
  const squadRanking = computeSquadRanking();
  const squadHighlight = squadRanking.length > 0
    ? { squad: squadRanking[0].squad, avgRating: squadRanking[0].avgRating }
    : { squad: "—", avgRating: 0 };

  return { pendentes, emAjustes, aprovados, total, avgRating, squadHighlight };
}


// ─── Unified Ranking ──────────────────────────────────


export function computeUnifiedRanking(filters?: Parameters<typeof getJobs>[0]): {
  position: number; name: string; materialsEvaluated: number; avgRating: number;
}[] {
  // Rankings always use FULL dataset — they are NOT affected by filters
  const jobs = getJobs();
  const jobIds = new Set(jobs.map(j => j.id));
  const data = loadData();

  // Load V1 feedback for filtered jobs
  const allFeedback = loadFeedback();
  const v1FeedbackByJob = new Map<string, ApprovalClientFeedback>();
  allFeedback.forEach(f => {
    if (!jobIds.has(f.job_id)) return;
    const vn = f.version_number || 1;
    if (vn !== 1) return;
    if (!v1FeedbackByJob.has(f.job_id)) {
      v1FeedbackByJob.set(f.job_id, f);
    }
  });

  // Build rated version map (fallback for version-level ratings)
  const ratedVersionByJob = new Map<string, ApprovalVersion>();
  const sortedVersions = [...data.versions].sort((a, b) => a.version_number - b.version_number);
  sortedVersions.forEach(v => {
    if (!jobIds.has(v.job_id)) return;
    if (ratedVersionByJob.has(v.job_id)) return;
    if ((v.art_rating && v.art_rating > 0) || (v.copy_rating && v.copy_rating > 0)) {
      ratedVersionByJob.set(v.job_id, v);
    }
  });

  // Build person stats iterating over JOBS (same pattern as squad ranking)
  // Designer/copywriter names are stored on the job object itself for user-created materials
  const map = new Map<string, { name: string; totalRating: number; count: number }>();

  jobs.forEach(job => {
    const jobAny = job as any;
    // Get designer/copywriter names from job (SSOT), fallback to version
    const version = ratedVersionByJob.get(job.id) || data.versions.find(v => v.job_id === job.id);
    const designerName: string | null = jobAny.designer_name || version?.designer_name || null;
    const copywriterName: string | null = jobAny.copywriter_name || version?.copywriter_name || null;

    // Get ratings: prefer feedback, fallback to version ratings
    const feedback = v1FeedbackByJob.get(job.id);
    const versionRated = ratedVersionByJob.get(job.id);
    const designRating = (feedback?.design_rating && feedback.design_rating > 0)
      ? feedback.design_rating
      : (versionRated?.art_rating && versionRated.art_rating > 0 ? versionRated.art_rating : null);
    const copyRating = (feedback?.copy_rating && feedback.copy_rating > 0)
      ? feedback.copy_rating
      : (versionRated?.copy_rating && versionRated.copy_rating > 0 ? versionRated.copy_rating : null);

    // Designer: design_rating
    if (designerName && designRating) {
      const entry = map.get(designerName) || { name: designerName, totalRating: 0, count: 0 };
      entry.totalRating += designRating;
      entry.count++;
      map.set(designerName, entry);
    }

    // Copywriter: copy_rating
    if (copywriterName && copyRating) {
      const entry = map.get(copywriterName) || { name: copywriterName, totalRating: 0, count: 0 };
      entry.totalRating += copyRating;
      entry.count++;
      map.set(copywriterName, entry);
    }
  });

  // Add registered creators with no data
  const registeredCreators = getActiveCreators();
  const existingNames = new Set(Array.from(map.values()).map(e => e.name));
  registeredCreators.forEach(name => {
    if (!existingNames.has(name)) {
      map.set(name, { name, totalRating: 0, count: 0 });
    }
  });

  let entries = Array.from(map.values());

  return entries
    .map(e => ({
      position: 0,
      name: e.name,
      materialsEvaluated: e.count,
      avgRating: e.count > 0 ? e.totalRating / e.count : 0,
    }))
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.materialsEvaluated !== a.materialsEvaluated) return b.materialsEvaluated - a.materialsEvaluated;
      return a.name.localeCompare(b.name);
    })
    .map((e, i) => ({ ...e, position: i + 1 }));
}

// ─── Squad Ranking ────────────────────────────────────

export interface SquadRankingEntry {
  position: number;
  squad: string;
  approved: number;
  avgRating: number;
  materialsEvaluated: number;
  lowSample: boolean;
}

export function computeSquadRanking(_filters?: Parameters<typeof getJobs>[0]): SquadRankingEntry[] {
  // Rankings always use FULL dataset — they are NOT affected by filters
  const jobs = getJobs();
  const filteredJobIds = new Set(jobs.map(j => j.id));
  const data = loadData();

  const allFeedback = loadFeedback();
  const v1FeedbackByJob = new Map<string, ApprovalClientFeedback>();
  allFeedback.forEach(f => {
    if (!filteredJobIds.has(f.job_id)) return;
    const vn = f.version_number || 1;
    if (vn !== 1) return;
    if (!v1FeedbackByJob.has(f.job_id)) {
      v1FeedbackByJob.set(f.job_id, f);
    }
  });

  // Find rated version per job
  const ratedVersionByJob = new Map<string, ApprovalVersion>();
  const sortedVersions = [...data.versions].sort((a, b) => a.version_number - b.version_number);
  sortedVersions.forEach(v => {
    if (!filteredJobIds.has(v.job_id)) return;
    if (ratedVersionByJob.has(v.job_id)) return;
    if ((v.art_rating && v.art_rating > 0) || (v.copy_rating && v.copy_rating > 0)) {
      ratedVersionByJob.set(v.job_id, v);
    }
  });

  // Build squad stats from materials
  const squadMap = new Map<string, { totalRating: number; evaluatedCount: number; approvedCount: number }>();

  jobs.forEach(job => {
    const jobAny = job as any;

    // Resolve squad using SSOT priority (same as Kanban):
    // 1. Manual squad on job
    // 2. Copywriter's squad (from profile)
    // 3. Designer's squad (from version or job)
    let squad: string | null = jobAny.squad || null;

    if (!squad) {
      // Try to resolve from people names on job
      const copName: string | null = jobAny.copywriter_name || null;
      const desName: string | null = jobAny.designer_name || null;
      const copSquad = copName ? getUserSquadByName(copName) : null;
      const desSquad = desName ? getUserSquadByName(desName) : null;
      squad = copSquad || desSquad || null;
    }

    if (!squad) {
      // Fallback: resolve from version-level data (seed data)
      const jobVersions = data.versions.filter(v => v.job_id === job.id);
      for (const v of jobVersions) {
        const copSquad = SQUAD_MAP[v.copywriter_id] || getUserSquadByName(v.copywriter_name);
        const desSquad = SQUAD_MAP[v.designer_id] || getUserSquadByName(v.designer_name);
        squad = copSquad || desSquad || null;
        if (squad) break;
      }
    }

    if (!squad) return;

    if (!squadMap.has(squad)) {
      squadMap.set(squad, { totalRating: 0, evaluatedCount: 0, approvedCount: 0 });
    }
    const entry = squadMap.get(squad)!;

    if (job.status === "aprovado") {
      entry.approvedCount++;
    }

    const feedback = v1FeedbackByJob.get(job.id);
    const version = ratedVersionByJob.get(job.id);
    const copyRating = (feedback?.copy_rating && feedback.copy_rating > 0) ? feedback.copy_rating : (version?.copy_rating && version.copy_rating > 0 ? version.copy_rating : null);
    const designRating = (feedback?.design_rating && feedback.design_rating > 0) ? feedback.design_rating : (version?.art_rating && version.art_rating > 0 ? version.art_rating : null);

    const ratings: number[] = [];
    if (copyRating) ratings.push(copyRating);
    if (designRating) ratings.push(designRating);
    if (ratings.length > 0) {
      const materialAvg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      entry.totalRating += materialAvg;
      entry.evaluatedCount++;
    }
  });

  const entries = Array.from(squadMap.entries()).map(([squad, data]) => ({
    position: 0,
    squad,
    approved: data.approvedCount,
    avgRating: data.evaluatedCount > 0 ? data.totalRating / data.evaluatedCount : 0,
    materialsEvaluated: data.evaluatedCount,
    lowSample: data.evaluatedCount < 2,
  }));

  // Sort: avgRating desc, materialsEvaluated desc, squad name asc
  entries.sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    if (b.materialsEvaluated !== a.materialsEvaluated) return b.materialsEvaluated - a.materialsEvaluated;
    return a.squad.localeCompare(b.squad);
  });

  return entries.map((e, i) => ({ ...e, position: i + 1 }));
}

export function getApprovedVersionsStats(filters?: Parameters<typeof getJobs>[0]): {
  count: number;
  avgRating: number;
  squadStats: { squad: string; avgRating: number; count: number }[];
} {
  const jobs = getJobs(filters);
  const data = loadData();
  const jobIds = new Set(jobs.map(j => j.id));
  const approvedVersions = data.versions.filter(v => jobIds.has(v.job_id) && v.status === "aprovada");

  // Count unique approved versions (not per-person)
  const count = approvedVersions.length;

  // Average rating across all ratings (art + copy per version, no double-counting)
  let totalRating = 0;
  let ratingCount = 0;
  approvedVersions.forEach(v => {
    if (v.art_rating) { totalRating += v.art_rating; ratingCount++; }
    if (v.copy_rating) { totalRating += v.copy_rating; ratingCount++; }
  });
  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Squad stats: average rating per squad (based on designer squad)
  const squadMap = new Map<string, { totalRating: number; count: number }>();
  approvedVersions.forEach(v => {
    const designerSquad = SQUAD_MAP[v.designer_id];
    if (designerSquad) {
      const entry = squadMap.get(designerSquad) || { totalRating: 0, count: 0 };
      if (v.art_rating) { entry.totalRating += v.art_rating; entry.count++; }
      squadMap.set(designerSquad, entry);
    }
    const copywriterSquad = SQUAD_MAP[v.copywriter_id];
    if (copywriterSquad) {
      const entry = squadMap.get(copywriterSquad) || { totalRating: 0, count: 0 };
      if (v.copy_rating) { entry.totalRating += v.copy_rating; entry.count++; }
      squadMap.set(copywriterSquad, entry);
    }
  });

  const squadStats = Array.from(squadMap, ([squad, s]) => ({
    squad,
    avgRating: s.count > 0 ? s.totalRating / s.count : 0,
    count: s.count,
  })).sort((a, b) => b.avgRating - a.avgRating);

  return { count, avgRating, squadStats };
}

export function computeOverallAvgRating(filters?: Parameters<typeof getJobs>[0]): number {
  return getApprovedVersionsStats(filters).avgRating;
}

export function computeSquadHighlight(filters?: Parameters<typeof getJobs>[0]): { squad: string; avgRating: number } {
  const squadRanking = computeSquadRanking(filters);
  if (squadRanking.length === 0) return { squad: "—", avgRating: 0 };
  // Top squad from the squad ranking (already sorted by avgRating desc)
  const top = squadRanking[0];
  return { squad: top.squad, avgRating: top.avgRating };
}

// ─── Ranking computations ─────────────────────────────

export function computeDesignerRanking(filters?: Parameters<typeof getJobs>[0]): {
  position: number; name: string; approved: number; avgRating: number; volume: number;
}[] {
  const jobs = getJobs(filters);
  const data = loadData();
  const jobIds = new Set(jobs.map(j => j.id));
  const approvedVersions = data.versions.filter(v => jobIds.has(v.job_id) && v.status === "aprovada");

  const map = new Map<string, { name: string; totalRating: number; count: number }>();
  approvedVersions.forEach(v => {
    const entry = map.get(v.designer_id) || { name: v.designer_name, totalRating: 0, count: 0 };
    entry.count++;
    if (v.art_rating) entry.totalRating += v.art_rating;
    map.set(v.designer_id, entry);
  });

  return Array.from(map.values())
    .map(e => ({
      position: 0,
      name: e.name,
      approved: e.count,
      avgRating: e.count > 0 ? e.totalRating / e.count : 0,
      volume: e.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating || b.approved - a.approved)
    .map((e, i) => ({ ...e, position: i + 1 }));
}

export function computeCopywriterRanking(filters?: Parameters<typeof getJobs>[0]): {
  position: number; name: string; approved: number; avgRating: number; volume: number;
}[] {
  const jobs = getJobs(filters);
  const data = loadData();
  const jobIds = new Set(jobs.map(j => j.id));
  const approvedVersions = data.versions.filter(v => jobIds.has(v.job_id) && v.status === "aprovada");

  const map = new Map<string, { name: string; totalRating: number; count: number }>();
  approvedVersions.forEach(v => {
    const entry = map.get(v.copywriter_id) || { name: v.copywriter_name, totalRating: 0, count: 0 };
    entry.count++;
    if (v.copy_rating) entry.totalRating += v.copy_rating;
    map.set(v.copywriter_id, entry);
  });

  return Array.from(map.values())
    .map(e => ({
      position: 0,
      name: e.name,
      approved: e.count,
      avgRating: e.count > 0 ? e.totalRating / e.count : 0,
      volume: e.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating || b.approved - a.approved)
    .map((e, i) => ({ ...e, position: i + 1 }));
}

export function updateJobStatus(jobId: string, status: ApprovalJobData["status"]) {
  const data = loadData();
  const job = data.jobs.find(j => j.id === jobId);
  if (job) {
    job.status = status;
    job.updated_at = new Date().toISOString();
    saveData(data);
  }
}

export function createJob(partial: Partial<ApprovalJobData> & Record<string, any>): ApprovalJobData {
  const data = loadData();
  const job: ApprovalJobData & Record<string, any> = {
    id: generateId(),
    title: partial.title || "Novo Job",
    client_name: partial.client_name || null,
    responsible_user_id: partial.responsible_user_id || "auth-mock-001",
    responsible_name: partial.responsible_name || "Admin DOT",
    status: partial.status || "rascunho",
    material_type: partial.material_type || "estaticos",
    start_date: new Date().toISOString(),
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    position: data.jobs.length,
    share_token: generateId(),
    // Extra fields from the wizard
    description: partial.description || null,
    caption: partial.caption || null,
    landing_page_link: partial.landing_page_link || null,
    creation_date: partial.creation_date || new Date().toISOString().split('T')[0],
    squad: partial.squad || null,
    attached_files: partial.attached_files || [],
    sent_for_approval_at: partial.status === "para_aprovacao" ? new Date().toISOString() : null,
  };
  data.jobs.push(job as any);
  saveData(data);
  return job as ApprovalJobData;
}

export function updateJob(jobId: string, updates: Partial<ApprovalJobData> & Record<string, any>): ApprovalJobData | null {
  const data = loadData();
  const job = data.jobs.find(j => j.id === jobId);
  if (!job) return null;
  // Record sent_for_approval_at when transitioning to para_aprovacao
  if (updates.status === "para_aprovacao" && !(job as any).sent_for_approval_at) {
    (job as any).sent_for_approval_at = new Date().toISOString();
  }
  Object.assign(job, updates, { updated_at: new Date().toISOString() });
  saveData(data);
  return job;
}

export function deleteJob(jobId: string) {
  const data = loadData();
  data.jobs = data.jobs.filter(j => j.id !== jobId);
  data.versions = data.versions.filter(v => v.job_id !== jobId);
  data.assets = data.assets.filter(a => a.job_id !== jobId);
  saveData(data);
}

// ─── Client Feedback (mock persistence) ───────────────

function getSeedFeedback(): ApprovalClientFeedback[] {
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  return [
    { id: "fb-seed-003", job_id: "ajob-003", client_name: "Itiban", copy_rating: 3, copy_comment: "Precisa ajustar o tom da comunicação.", design_rating: 4, design_comment: "Visual bom, mas ajustar cores.", approval_status: "em_ajustes", submitted_at: daysAgo(10), version_number: 1 },
    { id: "fb-seed-004", job_id: "ajob-004", client_name: "Paragon", copy_rating: 4, copy_comment: "Texto excelente!", design_rating: 5, design_comment: "Design perfeito.", approval_status: "aprovado", submitted_at: daysAgo(5), version_number: 1 },
    { id: "fb-seed-005", job_id: "ajob-005", client_name: "Café da Fazenda", copy_rating: 5, copy_comment: "Ótima copy!", design_rating: 4, design_comment: "Muito bom.", approval_status: "aprovado", submitted_at: daysAgo(3), version_number: 1 },
    { id: "fb-seed-006", job_id: "ajob-006", client_name: "Sul Solar", copy_rating: 4, copy_comment: "Aprovado.", design_rating: 3, design_comment: "Pode melhorar, mas aprovado.", approval_status: "aprovado", submitted_at: daysAgo(8), version_number: 1 },
    { id: "fb-seed-008", job_id: "ajob-008", client_name: "Huli", copy_rating: 5, copy_comment: "Perfeito!", design_rating: 5, design_comment: "Excelente!", approval_status: "aprovado", submitted_at: daysAgo(2), version_number: 1 },
    { id: "fb-seed-009", job_id: "ajob-009", client_name: "NEO", copy_rating: 3, copy_comment: "Ok.", design_rating: 4, design_comment: "Bom design.", approval_status: "aprovado", submitted_at: daysAgo(6), version_number: 1 },
    { id: "fb-seed-010", job_id: "ajob-010", client_name: "Linx", copy_rating: 4, copy_comment: "Gostei!", design_rating: 5, design_comment: "Lindo!", approval_status: "aprovado", submitted_at: daysAgo(7), version_number: 1 },
  ];
}

const FEEDBACK_SEED_KEY = "approval_feedback_seeded_v5";

function loadFeedback(): ApprovalClientFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as ApprovalClientFeedback[];
      // Seed if not yet seeded
      if (!localStorage.getItem(FEEDBACK_SEED_KEY)) {
        const seed = getSeedFeedback();
        const existingIds = new Set(data.map(f => f.id));
        const newEntries = seed.filter(s => !existingIds.has(s.id));
        if (newEntries.length > 0) {
          const merged = [...data, ...newEntries];
          localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(merged));
          localStorage.setItem(FEEDBACK_SEED_KEY, "true");
          return merged;
        }
      }
      return data;
    }
  } catch { /* ignore */ }
  // No existing data — seed from scratch
  const seed = getSeedFeedback();
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(seed));
  localStorage.setItem(FEEDBACK_SEED_KEY, "true");
  return seed;
}

function saveFeedback(feedback: ApprovalClientFeedback[]) {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
}

// ─── Content Versions (snapshot persistence) ─────────

function loadContentVersions(): Record<string, ApprovalContentVersion[]> {
  try {
    const raw = localStorage.getItem(VERSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveContentVersions(data: Record<string, ApprovalContentVersion[]>) {
  localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(data));
}

export function getContentVersions(jobId: string): ApprovalContentVersion[] {
  const all = loadContentVersions();
  return (all[jobId] || []).sort((a, b) => a.version_number - b.version_number);
}

function createContentVersion(jobId: string, params: {
  copyRating: number;
  copyComment: string;
  designRating: number;
  designComment: string;
  clientName: string;
  status: string;
  versionNumber?: number;
  creativeIndices?: number[];
  perCreative?: Array<{
    creative_index: number;
    copy_rating: number;
    copy_comment: string;
    design_rating: number;
    design_comment: string;
    status: "aprovado" | "em_ajustes";
  }>;
}): ApprovalContentVersion {
  const all = loadContentVersions();
  const existing = all[jobId] || [];
  const nextNum = params.versionNumber || (existing.length + 1);

  // Get current job snapshot
  const data = loadData();
  const job = data.jobs.find(j => j.id === jobId) as any;

  // Build per-creative snapshots — only for creatives in this version
  const files = job?.attached_files || [];
  const staticCount = job?.static_creative_count || 1;
  const staticCaptions = job?.static_captions || {};
  const creativeSnapshots: CreativeSnapshot[] = [];
  
  if (job?.material_type === "estaticos" && staticCount > 1) {
    const indicesToInclude = params.creativeIndices || Array.from({ length: staticCount }, (_, i) => i);
    for (const i of indicesToInclude) {
      const creativeFiles = files.filter((f: any) => f.creative === i + 1);
      creativeSnapshots.push({
        creative_index: i,
        feed_file: creativeFiles.find((f: any) => f.slot === "feed") || null,
        story_file: creativeFiles.find((f: any) => f.slot === "story") || null,
        caption: staticCaptions[i] || null,
      });
    }
  }

  // Build per-creative evaluations
  const perCreativeEvals: CreativeEvaluation[] | undefined = params.perCreative?.map(pc => ({
    creative_index: pc.creative_index,
    copy_rating: pc.copy_rating,
    copy_comment: pc.copy_comment,
    design_rating: pc.design_rating,
    design_comment: pc.design_comment,
    decision: pc.status,
    decided_at: new Date().toISOString(),
  }));

  const version: ApprovalContentVersion = {
    version_number: nextNum,
    created_at: new Date().toISOString(),
    snapshot: {
      files,
      caption: job?.caption || null,
      material_type: job?.material_type || "estaticos",
      landing_page_link: job?.landing_page_link || null,
      creatives: creativeSnapshots.length > 0 ? creativeSnapshots : undefined,
      static_creative_count: staticCount > 1 ? staticCount : undefined,
      static_captions: Object.keys(staticCaptions).length > 0 ? staticCaptions : undefined,
    },
    feedback: {
      copy_rating: params.copyRating,
      copy_comment: params.copyComment,
      design_rating: params.designRating,
      design_comment: params.designComment,
      client_name: params.clientName,
      status_at_feedback: params.status,
      per_creative: perCreativeEvals,
    },
  };

  existing.push(version);
  all[jobId] = existing;
  saveContentVersions(all);
  return version;
}

export function submitClientFeedback(params: {
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
  const feedback = loadFeedback();
  const existingForJob = feedback.filter(f => f.job_id === params.jobId);
  // Use sent version number if available, else fallback to feedback count
  const sentVersions = getSentVersions(params.jobId);
  const versionNumber = sentVersions.length > 0 ? sentVersions.length : existingForJob.length + 1;

  const entry: ApprovalClientFeedback = {
    id: generateId(),
    job_id: params.jobId,
    client_name: params.clientName,
    copy_rating: params.copyRating,
    copy_comment: params.copyComment,
    design_rating: params.designRating,
    design_comment: params.designComment,
    approval_status: params.status,
    submitted_at: new Date().toISOString(),
    version_number: versionNumber,
    per_creative: params.perCreative || undefined,
  };
  feedback.push(entry);
  saveFeedback(feedback);

  // Create content version snapshot — only for creatives in this version
  const creativeIndices = params.perCreative?.map(pc => pc.creative_index);
  createContentVersion(params.jobId, {
    copyRating: params.copyRating,
    copyComment: params.copyComment,
    designRating: params.designRating,
    designComment: params.designComment,
    clientName: params.clientName,
    status: params.status,
    versionNumber,
    creativeIndices,
    perCreative: params.perCreative,
  });

  // Update creative states for partial approval
  if (params.perCreative && params.perCreative.length > 0) {
    params.perCreative.forEach(pc => {
      if (pc.status === "aprovado") {
        updateCreativeState(params.jobId, pc.creative_index, {
          finalDecision: "APPROVED",
          approvedAtVersion: versionNumber,
          approvedAt: new Date().toISOString(),
          locked: true,
        });
      }
      // PENDING stays as-is (no change needed for em_ajustes)
    });

    // Check if ALL creatives are now approved
    const states = getCreativeStates(params.jobId);
    const allApproved = states.length > 0 && states.every(s => s.finalDecision === "APPROVED");
    const pendingIndices = states.filter(s => s.finalDecision === "PENDING").map(s => s.creativeIndex);
    if (allApproved) {
      updateJobStatus(params.jobId, "aprovado");
      updateJob(params.jobId, { pending_creative_indices: [] } as any);
    } else {
      // Some pending = em_ajustes
      updateJobStatus(params.jobId, "em_ajustes");
      updateJob(params.jobId, { pending_creative_indices: pendingIndices } as any);
    }
  } else {
    // Legacy single creative: update job status directly
    updateJobStatus(params.jobId, params.status);
  }

  // If approved, update the latest version ratings
  if (params.status === "aprovado") {
    const data = loadData();
    const versions = data.versions.filter(v => v.job_id === params.jobId);
    if (versions.length > 0) {
      const latest = versions[versions.length - 1];
      latest.art_rating = params.designRating;
      latest.copy_rating = params.copyRating;
      latest.status = "aprovada";
      saveData(data);
    }
  }

  return entry;
}

export function getClientFeedback(jobId: string): ApprovalClientFeedback[] {
  return loadFeedback()
    .filter(f => f.job_id === jobId)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
}

// ─── Creative States (canonical per-creative approval) ─

function loadCreativeStates(): Record<string, MaterialCreativeState[]> {
  try {
    const raw = localStorage.getItem(CREATIVE_STATES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveCreativeStates(data: Record<string, MaterialCreativeState[]>) {
  localStorage.setItem(CREATIVE_STATES_KEY, JSON.stringify(data));
}

export function getCreativeStates(jobId: string): MaterialCreativeState[] {
  const all = loadCreativeStates();
  return all[jobId] || [];
}

export function initCreativeStates(jobId: string, count: number) {
  const all = loadCreativeStates();
  if (all[jobId] && all[jobId].length === count) return; // Already initialized
  const states: MaterialCreativeState[] = [];
  const existing = all[jobId] || [];
  for (let i = 0; i < count; i++) {
    const prev = existing.find(s => s.creativeIndex === i);
    states.push(prev || {
      creativeIndex: i,
      finalDecision: "PENDING",
      locked: false,
    });
  }
  all[jobId] = states;
  saveCreativeStates(all);
}

function updateCreativeState(jobId: string, creativeIndex: number, updates: Partial<MaterialCreativeState>) {
  const all = loadCreativeStates();
  const states = all[jobId] || [];
  const idx = states.findIndex(s => s.creativeIndex === creativeIndex);
  if (idx >= 0) {
    states[idx] = { ...states[idx], ...updates };
  } else {
    states.push({ creativeIndex, finalDecision: "PENDING", locked: false, ...updates });
  }
  all[jobId] = states;
  saveCreativeStates(all);
}

// ─── Sent Versions (tracks each send/resend) ─────────

function loadSentVersions(): Record<string, SentVersionRecord[]> {
  try {
    const raw = localStorage.getItem(SENT_VERSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveSentVersions(data: Record<string, SentVersionRecord[]>) {
  localStorage.setItem(SENT_VERSIONS_KEY, JSON.stringify(data));
}

export function getSentVersions(jobId: string): SentVersionRecord[] {
  const all = loadSentVersions();
  return (all[jobId] || []).sort((a, b) => a.versionNumber - b.versionNumber);
}

// ─── Official Ratings (immutable first-version ratings) ─
export interface OfficialRatings {
  copyRating: number;
  designRating: number;
  perCreative?: Record<number, { copyRating: number; designRating: number }>;
}

export function getOfficialRatings(jobId: string): OfficialRatings | null {
  const feedback = loadFeedback()
    .filter(f => f.job_id === jobId)
    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
  
  if (feedback.length === 0) return null;
  
  // First feedback = official ratings
  const first = feedback[0];
  const result: OfficialRatings = {
    copyRating: first.copy_rating,
    designRating: first.design_rating,
  };
  
  // Per-creative ratings from first feedback
  if (first.per_creative && first.per_creative.length > 0) {
    result.perCreative = {};
    first.per_creative.forEach(pc => {
      result.perCreative![pc.creative_index] = {
        copyRating: pc.copy_rating,
        designRating: pc.design_rating,
      };
    });
  }
  
  return result;
}

// Get job data formatted for the client approval page (by share_token)
export function getJobByShareToken(shareToken: string): any | null {
  const data = loadData();
  const job = data.jobs.find((j: any) => j.share_token === shareToken) as any;
  if (!job) return null;

  const isStatic = job.material_type === "estaticos";
  const isVideo = job.material_type === "videos";
  const staticCount = job.static_creative_count || 1;
  const videoCount = job.video_count || 1;
  const itemCount = isStatic ? staticCount : isVideo ? videoCount : 1;

  // Get creative states and sent versions
  const states = getCreativeStates(job.id);
  const sentVersions = getSentVersions(job.id);
  const latestSent = sentVersions.length > 0 ? sentVersions[sentVersions.length - 1] : null;

  // Determine pending creative indices
  let pendingIndices: number[];
  if (states.length > 0) {
    pendingIndices = states.filter(s => s.finalDecision === "PENDING").map(s => s.creativeIndex);
  } else if (latestSent) {
    pendingIndices = latestSent.creativeIndices;
  } else {
    pendingIndices = Array.from({ length: itemCount }, (_, i) => i);
  }

  // Get official ratings for re-evaluation detection
  const officialRatings = getOfficialRatings(job.id);

  return {
    id: job.id,
    title: job.title,
    client_name: job.client_name,
    description: job.description || job.caption || null,
    status: job.status,
    material_type: job.material_type,
    attached_files: job.attached_files || [],
    static_creative_count: isStatic ? staticCount : null,
    static_captions: isStatic ? (job.static_captions || {}) : null,
    video_count: isVideo ? videoCount : null,
    video_captions: isVideo ? (job.video_captions || {}) : null,
    share_token: job.share_token,
    approval_deadline: job.approval_deadline || null,
    pending_creative_indices: pendingIndices,
    current_version_number: latestSent?.versionNumber || 1,
    official_ratings: officialRatings,
    landing_page_link: job.landing_page_link || null,
    lpLink: job.lpLink || job.urlLP || job.linkLandingPage || job.link || job.landing_page_link || null,
  };
}

export function createSentVersion(jobId: string): SentVersionRecord {
  const all = loadSentVersions();
  const existing = all[jobId] || [];
  const nextNum = existing.length + 1;

  // Get creative states to determine which are pending
  const states = getCreativeStates(jobId);
  const pendingIndices = states.length > 0
    ? states.filter(s => s.finalDecision === "PENDING").map(s => s.creativeIndex)
    : []; // empty means all creatives (first send)

  // If no states initialized yet, include all creatives
  const data = loadData();
  const job = data.jobs.find(j => j.id === jobId) as any;
  const totalCreatives = job?.static_creative_count || 1;
  const indices = pendingIndices.length > 0
    ? pendingIndices
    : Array.from({ length: totalCreatives }, (_, i) => i);

  const record: SentVersionRecord = {
    versionNumber: nextNum,
    sentAt: new Date().toISOString(),
    creativeIndices: indices,
  };

  existing.push(record);
  all[jobId] = existing;
  saveSentVersions(all);

  return record;
}
