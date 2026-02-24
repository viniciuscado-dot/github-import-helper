import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ApprovalColumn } from "./ApprovalColumn";
import { JobDialog } from "./JobDialog";
import { getJobs, getVersions, ApprovalJobData } from "@/services/approvalDataService";
import { getUserSquadByName } from "@/utils/getActiveUsers";

interface ApprovalKanbanProps {
  showArchived: boolean;
  showDeleted?: boolean;
  filters: {
    creator?: string;
    client?: string;
    squad?: string;
    materialType?: string;
    startDate?: string;
    endDate?: string;
  };
}

const DEFAULT_COLUMNS = [
  { id: "rascunho", title: "Rascunho", icon: "📝", accent: "border-muted-foreground/30" },
  { id: "para_aprovacao", title: "Enviado para aprovação", icon: "📤", accent: "border-blue-500/50" },
  { id: "em_ajustes", title: "Em ajustes", icon: "⚠️", accent: "border-amber-500/50" },
  { id: "aprovado", title: "Aprovado", icon: "✅", accent: "border-emerald-500/50" },
];

const ARCHIVED_COLUMN = { id: "arquivado", title: "Arquivado", icon: "📦", accent: "border-muted-foreground/30" };
const DELETED_COLUMN = { id: "deletado", title: "Lixeira", icon: "🗑️", accent: "border-destructive/30" };

export function ApprovalKanban({ showArchived, showDeleted, filters }: ApprovalKanbanProps) {
  const [selectedJob, setSelectedJob] = useState<ApprovalJobData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [jobs, setJobs] = useState<ApprovalJobData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function loadJobs() {
      const statusFilter = showDeleted ? "deletado" : showArchived ? "arquivado" : undefined;
      const allJobs = await getJobs({ ...filters, status: statusFilter });
      if (showDeleted || showArchived) {
        setJobs(allJobs);
      } else {
        setJobs(allJobs.filter(j => j.status !== "arquivado" && j.status !== "deletado"));
      }
    }
    loadJobs();
  }, [filters, showArchived, showDeleted, refreshKey]);

  const jobSquadMap = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((j: any) => {
      if (j.squad_source === "manual" && j.squad) {
        map.set(j.id, j.squad);
      } else if (j.squad) {
        const copywriterSquad = j.copywriter_name ? getUserSquadByName(j.copywriter_name) : null;
        const designerSquad = j.designer_name ? getUserSquadByName(j.designer_name) : null;
        map.set(j.id, copywriterSquad || designerSquad || j.squad);
      } else {
        const copywriterSquad = j.copywriter_name ? getUserSquadByName(j.copywriter_name) : null;
        const designerSquad = j.designer_name ? getUserSquadByName(j.designer_name) : null;
        if (copywriterSquad || designerSquad) {
          map.set(j.id, (copywriterSquad || designerSquad)!);
        }
      }
    });
    return map;
  }, [jobs]);

  const handleStatusChange = useCallback((jobId: string, newStatus: string) => {
    setHighlightedJobId(jobId);
    setTimeout(() => setHighlightedJobId(null), 1500);
    toast({ title: "Status atualizado", description: "O material foi movido com sucesso." });
  }, [toast]);

  function handleCardClick(job: ApprovalJobData) {
    setSelectedJob(job);
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setSelectedJob(null);
    setRefreshKey(k => k + 1);
  }

  const displayColumns = showDeleted ? [DELETED_COLUMN] : showArchived ? [ARCHIVED_COLUMN] : DEFAULT_COLUMNS;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayColumns.map((column) => {
          const columnJobs = jobs.filter((job) => job.status === column.id);
          const isSingleColumn = displayColumns.length === 1;
          return (
            <div key={column.id} className={isSingleColumn ? "col-span-1 md:col-span-2 lg:col-span-4" : ""}>
              <ApprovalColumn
                id={column.id}
                title={column.title}
                icon={column.icon}
                accent={column.accent}
                jobs={columnJobs}
                highlightedJobId={highlightedJobId}
                onCardClick={handleCardClick}
                jobSquadMap={jobSquadMap}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <JobDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
            else setIsDialogOpen(true);
          }}
          job={selectedJob}
          onSave={() => setRefreshKey(k => k + 1)}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
