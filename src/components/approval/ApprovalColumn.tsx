import { cn } from "@/lib/utils";
import { ApprovalJobCard } from "./ApprovalJobCard";
import { ApprovalJobData } from "@/services/approvalDataService";
import { layoutTokens } from "./layout/layoutTokens";

interface ApprovalColumnProps {
  id: string;
  title: string;
  icon: string;
  accent: string;
  jobs: ApprovalJobData[];
  highlightedJobId?: string | null;
  onCardClick: (job: ApprovalJobData) => void;
  jobSquadMap?: Map<string, string>;
  onRefresh?: () => void;
}

export function ApprovalColumn({ id, title, icon, accent, jobs, highlightedJobId, onCardClick, jobSquadMap, onRefresh }: ApprovalColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className={cn(
        "rounded-xl border-2 bg-card p-3 flex items-center justify-between",
        accent
      )}>
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full tabular-nums">
          {jobs.length}
        </span>
      </div>

      {/* Cards area */}
      <div className="space-y-2.5 min-h-[120px]">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground">
            Nenhum material
          </div>
        ) : (
          jobs.map((job) => (
            <ApprovalJobCard
              key={job.id}
              job={job}
              status={id}
              squad={jobSquadMap?.get(job.id)}
              highlighted={highlightedJobId === job.id}
              onClick={() => onCardClick(job)}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}
