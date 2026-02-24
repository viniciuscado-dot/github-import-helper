import { useState, useMemo } from "react";
import { JobDialog } from "./JobDialog";
import { layoutTokens } from "./layout/layoutTokens";
import { getJobs, getVersions, ApprovalJobData } from "@/services/approvalDataService";
import { getUserSquadByName } from "@/utils/getActiveUsers";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApprovalFilters } from "@/pages/Aprovacao";

const SQUAD_COLORS: Record<string, string> = {
  Athena: "border-blue-400/50 text-blue-400 bg-blue-500/10",
  Ártemis: "border-emerald-400/50 text-emerald-400 bg-emerald-500/10",
  Ares: "border-red-400/50 text-red-400 bg-red-500/10",
  Apollo: "border-amber-400/50 text-amber-400 bg-amber-500/10",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted-foreground/20 text-muted-foreground" },
  para_aprovacao: { label: "Para aprovação", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  em_ajustes: { label: "Em ajustes", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  aprovado: { label: "Aprovado", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  arquivado: { label: "Arquivado", color: "bg-muted-foreground/20 text-muted-foreground" },
};

const MATERIAL_LABELS: Record<string, string> = {
  estaticos: "Estáticos",
  videos: "Vídeos",
  carrossel: "Carrossel",
  landing_page: "Landing Page",
};

interface ApprovalListViewProps {
  filters: ApprovalFilters;
}

export function ApprovalListView({ filters }: ApprovalListViewProps) {
  const [selectedJob, setSelectedJob] = useState<ApprovalJobData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const allVersions = useMemo(() => getVersions(), []);

  const jobs = useMemo(() => {
    const all = getJobs(filters);
    return [...all].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filters]);

  // Map job → designer name and squad from versions/job
  const { jobDesignerMap, jobSquadMap } = useMemo(() => {
    const dMap = new Map<string, string>();
    const sMap = new Map<string, string>();
    jobs.forEach(job => {
      const jobAny = job as any;
      // Designer
      const version = allVersions.find(v => v.job_id === job.id);
      dMap.set(job.id, jobAny.designer_name || version?.designer_name || "—");
      // Squad: prefer manual on job, then resolve from people
      if (jobAny.squad) {
        sMap.set(job.id, jobAny.squad);
      } else {
        const copySquad = jobAny.copywriter_name ? getUserSquadByName(jobAny.copywriter_name) : null;
        const desSquad = (jobAny.designer_name || version?.designer_name) ? getUserSquadByName(jobAny.designer_name || version?.designer_name) : null;
        sMap.set(job.id, copySquad || desSquad || "—");
      }
    });
    return { jobDesignerMap: dMap, jobSquadMap: sMap };
  }, [jobs, allVersions]);

  function handleRowClick(job: ApprovalJobData) {
    setSelectedJob(job);
    setIsDialogOpen(true);
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Lista de Materiais</h1>

      {/* Table */}
      <div className={`${layoutTokens.card.base} overflow-hidden`}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Campanha / Material</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Designer</TableHead>
              <TableHead className="font-semibold">Squad</TableHead>
              <TableHead className="font-semibold">Data de criação</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum material encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.rascunho;
                return (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(job)}
                  >
                    <TableCell className="font-medium">{job.client_name || "—"}</TableCell>
                    <TableCell>{job.title}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {MATERIAL_LABELS[job.material_type] || job.material_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {jobDesignerMap.get(job.id) || "—"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const squad = jobSquadMap.get(job.id);
                        if (!squad || squad === "—") return <span className="text-muted-foreground">—</span>;
                        return (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${SQUAD_COLORS[squad] || "border-border/60 text-muted-foreground bg-muted/40"}`}>
                            {squad}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(job.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${status.color} border-0 text-xs font-medium`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedJob && (
        <JobDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          job={selectedJob}
          onSave={() => { setIsDialogOpen(false); setSelectedJob(null); }}
          onClose={() => { setIsDialogOpen(false); setSelectedJob(null); }}
        />
      )}
    </>
  );
}
