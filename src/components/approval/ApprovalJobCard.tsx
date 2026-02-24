import { useState } from "react";
import { cn } from "@/lib/utils";
import { Share2, MoreVertical, CheckCircle, Eye } from "lucide-react";
import { ApprovalJobData, updateJobStatus, deleteJob } from "@/services/approvalDataService";
import { MaterialPreviewDialog } from "./MaterialPreviewDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  estaticos: "Estáticos",
  videos: "Vídeos",
  carrossel: "Carrossel",
  landing_page: "Landing Page",
};

const SQUAD_COLORS: Record<string, string> = {
  Athena: "border-blue-400/50 text-blue-400 bg-blue-500/10",
  Ártemis: "border-emerald-400/50 text-emerald-400 bg-emerald-500/10",
  Ares: "border-red-400/50 text-red-400 bg-red-500/10",
  Apollo: "border-amber-400/50 text-amber-400 bg-amber-500/10",
};

interface ApprovalJobCardProps {
  job: ApprovalJobData;
  status: string;
  squad?: string;
  highlighted?: boolean;
  onClick: () => void;
  onRefresh?: () => void;
}

export function ApprovalJobCard({ job, status, squad, highlighted, onClick, onRefresh }: ApprovalJobCardProps) {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/aprovacao-cliente/${job.share_token}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Link copiado!", description: "Link de aprovação copiado." });
    }).catch(() => {
      toast({ title: "Erro", description: "Não foi possível copiar.", variant: "destructive" });
    });
  }

  const isParaAprovacao = status === "para_aprovacao";
  const isAjustes = status === "em_ajustes";
  const isAprovado = status === "aprovado";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-lg border bg-card p-3 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-border hover:-translate-y-0.5",
        "border-border/50",
        "h-[168px] flex flex-col",
        isParaAprovacao && "border-l-2 border-l-blue-500/60",
        isAjustes && "border-l-2 border-l-amber-500/60",
        isAprovado && "border-l-2 border-l-emerald-500/60",
        highlighted && "ring-2 ring-primary/40 animate-pulse"
      )}
    >
      {/* Title + client */}
      <div className="mb-2">
        <div className="flex items-start gap-1.5">
          <h4 className="font-medium text-sm text-foreground truncate flex-1">
            {job.title || "Sem título"}
          </h4>
          {isAprovado && (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
          )}
        </div>
        {job.client_name && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {job.client_name}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {MATERIAL_TYPE_LABELS[job.material_type] || job.material_type}
        </span>
        {squad && (
          <span className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
            SQUAD_COLORS[squad] || "border-border/60 text-muted-foreground bg-muted/40"
          )}>
            {squad}
          </span>
        )}
      </div>

      {/* Spacer for consistent card height */}
      <div className="flex-1" />

      {/* Footer actions — pushed to bottom */}
      <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleShare}
            title="Compartilhar link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              setPreviewOpen(true);
            }}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Visualizar como cliente
            </DropdownMenuItem>
            {status === "deletado" ? (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  updateJobStatus(job.id, "rascunho");
                  toast({ title: "Material restaurado", description: "O material voltou para o kanban." });
                  onRefresh?.();
                }}>
                  Restaurar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  deleteJob(job.id);
                  toast({ title: "Material excluído", description: "O material foi removido permanentemente." });
                  onRefresh?.();
                }} className="text-destructive">
                  Excluir permanentemente
                </DropdownMenuItem>
              </>
            ) : status === "arquivado" ? (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  updateJobStatus(job.id, "rascunho");
                  toast({ title: "Material desarquivado", description: "O material voltou para o kanban." });
                  onRefresh?.();
                }}>
                  Desarquivar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  updateJobStatus(job.id, "deletado");
                  toast({ title: "Material deletado", description: "O material foi movido para a lixeira." });
                  onRefresh?.();
                }} className="text-destructive">
                  Deletar
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                updateJobStatus(job.id, "arquivado");
                toast({ title: "Material arquivado", description: "O material foi movido para arquivados." });
                onRefresh?.();
              }}>
                Arquivar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render outside the clickable card area to prevent editor from opening on close */}
      <div onClick={(e) => e.stopPropagation()}>
        <MaterialPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          job={job as any}
          squad={squad}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
}
