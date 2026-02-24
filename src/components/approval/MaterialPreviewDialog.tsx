import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  User,
  Megaphone,
  Pencil,
  CheckCircle2,
  Film,
  ExternalLink,
  Copy,
  FileText,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { InstagramStoryPreview } from "./InstagramStoryPreview";
import { VideoStoryPreview } from "./VideoStoryPreview";
import { useToast } from "@/hooks/use-toast";
import { submitClientFeedback, getCreativeStates, getOfficialRatings, type ApprovalJobData, type OfficialRatings } from "@/services/approvalDataService";

interface MaterialPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ApprovalJobData & Record<string, any>;
  squad?: string;
  onRefresh?: () => void;
}

function StarRating({
  value,
  hovered,
  onChange,
  onHover,
  onLeave,
  disabled,
}: {
  value: number;
  hovered: number;
  onChange: (v: number) => void;
  onHover: (v: number) => void;
  onLeave: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          className="transition-transform hover:scale-110"
          disabled={disabled}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReadOnlyStarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="cursor-default">
          <Star className={`h-5 w-5 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
        </div>
      ))}
    </div>
  );
}

function TextOnlyScore({ label, value }: { label: string; value: number }) {
  return (
    <p className="text-sm text-muted-foreground">
      Nota oficial ({label}): <span className="font-semibold text-foreground">{value.toFixed(1)}/5</span>
    </p>
  );
}

interface CreativeRating {
  copyRating: number;
  copyHovered: number;
  copyComment: string;
  designRating: number;
  designHovered: number;
  designComment: string;
}

export function MaterialPreviewDialog({ open, onOpenChange, job, squad, onRefresh }: MaterialPreviewDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const isStatic = (job as any).material_type === "estaticos";
  const isVideo = (job as any).material_type === "videos";
  const isLandingPage = (job as any).material_type === "landing_page";
  const staticCreativeCount = (job as any).static_creative_count || 1;
  const videoCount = (job as any).video_count || 1;
  const staticCaptions: Record<number, string> = (job as any).static_captions || {};
  const videoCaptions: Record<number, string> = (job as any).video_captions || {};

  // Determine number of creatives/videos
  const creativeCount = isStatic ? staticCreativeCount : isVideo ? videoCount : 1;

  // Get creative states to know which are already approved (locked)
  const approvedCreativeIndices = useMemo(() => {
    if ((!isStatic && !isVideo) || !job?.id) return new Set<number>();
    const states = getCreativeStates(job.id);
    return new Set(states.filter(s => s.finalDecision === "APPROVED").map(s => s.creativeIndex));
  }, [isStatic, isVideo, job?.id, open]);

  const isCreativeApproved = (idx: number) => approvedCreativeIndices.has(idx);

  // Pending creative indices (only these are evaluable)
  const pendingCreativeIndices = useMemo(() => {
    if (!isStatic && !isVideo) return [];
    return Array.from({ length: creativeCount }, (_, i) => i).filter(i => !approvedCreativeIndices.has(i));
  }, [isStatic, isVideo, creativeCount, approvedCreativeIndices]);

  // Official ratings detection for re-submissions
  const officialRatings: OfficialRatings | null = useMemo(() => {
    if (!job?.id) return null;
    return getOfficialRatings(job.id);
  }, [job?.id, open]);

  const isResubmission = !!officialRatings;

  const getOfficialCreativeRating = (idx: number) => {
    if (!officialRatings?.perCreative) return null;
    return officialRatings.perCreative[idx] || null;
  };

  // Per-creative ratings state
  const [ratings, setRatings] = useState<Record<number, CreativeRating>>({});
  const [creativeStatuses, setCreativeStatuses] = useState<Record<number, "aprovado" | "em_ajustes" | null>>({});

  const getRating = (idx: number): CreativeRating => ratings[idx] || {
    copyRating: 0, copyHovered: 0, copyComment: "",
    designRating: 0, designHovered: 0, designComment: "",
  };

  const updateRating = (idx: number, updates: Partial<CreativeRating>) => {
    setRatings(prev => ({
      ...prev,
      [idx]: { ...getRating(idx), ...updates },
    }));
  };

  // Non-static: single set of ratings (legacy compat)
  const [copyRating, setCopyRating] = useState(0);
  const [copyHovered, setCopyHovered] = useState(0);
  const [copyComment, setCopyComment] = useState("");
  const [designRating, setDesignRating] = useState(0);
  const [designHovered, setDesignHovered] = useState(0);
  const [designComment, setDesignComment] = useState("");

  const imageFiles = (job.attached_files || [])
    .filter((f: any) => f?.type?.startsWith("image/"))
    .map((f: any) => ({ url: f.url, name: f.name, creative: f.creative, slot: f.slot }));

  // Extract video files from attached_files with fallback URL resolution
  const videoFiles = useMemo(() => {
    const attached = job.attached_files || [];
    const vids = attached.filter((f: any) => {
      if (f?.type?.startsWith("video/")) return true;
      const ext = (f?.url || f?.name || "").split(".").pop()?.toLowerCase();
      return ["mp4", "mov", "webm", "m4v"].includes(ext || "");
    });
    return vids.map((f: any) => ({
      url: f.url || f.fileUrl || f.src || f.path || f.downloadUrl,
      name: f.name,
      creative: f.creative,
    }));
  }, [job.attached_files]);

  // Debug: data source for videos
  const debugVideoSource = useMemo(() => {
    if (!isVideo) return "";
    if (videoFiles.length > 0) return "job.attached_files (type=video/*)";
    return "NENHUM VÍDEO ENCONTRADO";
  }, [isVideo, videoFiles]);

  const caption = job.caption || job.description || "";

  // Get images for a specific creative index (0-based)
  const getCreativeImages = (idx: number) => {
    return imageFiles.filter((f: any) => f.creative === idx + 1);
  };

  const getCreativeFeedImages = (idx: number) => {
    return getCreativeImages(idx).filter((f: any) => f.slot === 'feed');
  };

  const getCreativeStoryImages = (idx: number) => {
    return getCreativeImages(idx).filter((f: any) => f.slot === 'story');
  };

  // Get video for a specific index (0-based)
  const getVideoForIndex = (idx: number) => {
    const matches = videoFiles.filter((f: any) => f.creative === idx + 1);
    return matches.length > 0 ? matches[0] : null;
  };

  async function handleSubmit(status: "em_ajustes" | "aprovado") {
    try {
      setSubmitting(true);

      if ((isStatic && creativeCount > 1) || isVideo) {
        // Per-creative submission — only include PENDING creatives
        const perCreative = pendingCreativeIndices.map(i => {
          const r = getRating(i);
          const cStatus = creativeStatuses[i] || status;
          return {
            creative_index: i,
            copy_rating: r.copyRating,
            copy_comment: r.copyComment,
            design_rating: r.designRating,
            design_comment: r.designComment,
            status: cStatus as "aprovado" | "em_ajustes",
          };
        });

        // Determine overall status: if any creative has "em_ajustes", job is "em_ajustes"
        const hasAdjustment = perCreative.some(c => c.status === "em_ajustes");
        const overallStatus = hasAdjustment ? "em_ajustes" : "aprovado";

        // Compute average ratings for backward compat
        const avgCopy = perCreative.reduce((s, c) => s + c.copy_rating, 0) / perCreative.length;
        const avgDesign = perCreative.reduce((s, c) => s + c.design_rating, 0) / perCreative.length;

        submitClientFeedback({
          jobId: job.id,
          clientName: job.client_name || "Cliente",
          copyRating: Math.round(avgCopy),
          copyComment: perCreative.map(c => c.copy_comment).filter(Boolean).join(" | "),
          designRating: Math.round(avgDesign),
          designComment: perCreative.map(c => c.design_comment).filter(Boolean).join(" | "),
          status: overallStatus,
          perCreative,
        });

        const itemLabel = isVideo ? "vídeos" : "criativos";
        toast({
          title: overallStatus === "aprovado" ? "Materiais aprovados" : "Alteração solicitada",
          description: overallStatus === "aprovado"
            ? `Todos os ${itemLabel} foram aprovados.`
            : `Os ${itemLabel} com ajustes foram registrados.`,
        });
      } else {
        // Legacy single-creative flow
        submitClientFeedback({
          jobId: job.id,
          clientName: job.client_name || "Cliente",
          copyRating,
          copyComment,
          designRating,
          designComment,
          status,
        });
        toast({
          title: status === "aprovado" ? "Material aprovado" : "Alteração solicitada",
          description: status === "aprovado"
            ? "O material foi aprovado com sucesso."
            : "O material foi movido para ajustes.",
        });
      }

      onRefresh?.();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
      setCopyRating(0); setCopyComment(""); setDesignRating(0); setDesignComment("");
      setRatings({}); setCreativeStatuses({});
    }
  }

  function handleCreativeAction(idx: number, status: "aprovado" | "em_ajustes") {
    setCreativeStatuses(prev => ({ ...prev, [idx]: status }));
    toast({
      title: status === "aprovado" ? `Criativo ${idx + 1} aprovado` : `Criativo ${idx + 1}: ajuste solicitado`,
      description: status === "aprovado"
        ? `Criativo ${idx + 1} marcado como aprovado.`
        : `Criativo ${idx + 1} marcado para ajuste.`,
    });
    // Auto-advance to next PENDING creative (skip approved)
    const currentPosInPending = pendingCreativeIndices.indexOf(idx);
    if (currentPosInPending >= 0 && currentPosInPending + 1 < pendingCreativeIndices.length) {
      setActiveCreativeTab(String(pendingCreativeIndices[currentPosInPending + 1]));
    }
  }

  // Check if all PENDING creatives/videos have been evaluated (skip approved ones)
  const allCreativesEvaluated = useMemo(() => {
    if (!isStatic && !isVideo) return true;
    if (creativeCount <= 1 && !isVideo) return true;
    for (const i of pendingCreativeIndices) {
      if (!creativeStatuses[i]) return false;
    }
    return pendingCreativeIndices.length > 0;
  }, [isStatic, isVideo, creativeCount, creativeStatuses]);

  const [activeSlot, setActiveSlot] = useState<Record<number, "feed" | "story">>({});
  const [activeCreativeTab, setActiveCreativeTab] = useState(() => 
    String(pendingCreativeIndices.length > 0 ? pendingCreativeIndices[0] : 0)
  );

  const getActiveSlot = (idx: number): "feed" | "story" => activeSlot[idx] || "feed";

  const renderCreativeBlock = (idx: number) => {
    const r = getRating(idx);
    const feedImages = getCreativeFeedImages(idx);
    const storyImages = getCreativeStoryImages(idx);
    const allImages = getCreativeImages(idx);
    const creativeCaption = staticCaptions[idx] || caption;
    const cStatus = creativeStatuses[idx];
    const slot = getActiveSlot(idx);

    const isLocked = isCreativeApproved(idx);

    return (
      <div className="space-y-6">
        {/* Approved badge (locked creative) */}
        {isLocked && (
          <Badge className="bg-emerald-600 text-white">✅ Já aprovado</Badge>
        )}

        {/* Status badge if set (current session) */}
        {!isLocked && cStatus && (
          <Badge variant={cStatus === "aprovado" ? "default" : "destructive"} className={cStatus === "aprovado" ? "bg-emerald-600" : ""}>
            {cStatus === "aprovado" ? "✓ Aprovado" : "⚠ Ajuste solicitado"}
          </Badge>
        )}

        {/* Feed / Story toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveSlot(prev => ({ ...prev, [idx]: "feed" }))}
              className={`px-5 py-1.5 text-sm rounded-md transition-all ${slot === "feed" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveSlot(prev => ({ ...prev, [idx]: "story" }))}
              className={`px-5 py-1.5 text-sm rounded-md transition-all ${slot === "story" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Story
            </button>
          </div>
        </div>

        {/* Conditional rendering: only one slot at a time */}
        <Card className="border-border/40">
          <CardContent className="p-6">
            {slot === "feed" ? (
              feedImages.length > 0 ? (
                <div className="flex justify-center">
                  <InstagramPostPreview
                    images={feedImages}
                    description={creativeCaption}
                    clientName={job.client_name || "Cliente"}
                    hideMoreButton
                    compact
                  />
                </div>
              ) : allImages.length > 0 ? (
                <div className="flex justify-center">
                  <InstagramPostPreview
                    images={allImages}
                    description={creativeCaption}
                    clientName={job.client_name || "Cliente"}
                    hideMoreButton
                    compact
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground">
                  Sem imagem Feed
                </div>
              )
            ) : (
              storyImages.length > 0 ? (
                <InstagramStoryPreview
                  images={storyImages}
                  clientName={job.client_name || "Cliente"}
                />
              ) : (
                <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground">
                  Sem imagem Story
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Caption */}
        {creativeCaption && (
          <Card className="border-border/40">
            <CardContent className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground">Legenda do Criativo {idx + 1}</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{creativeCaption}</p>
            </CardContent>
          </Card>
        )}

        {/* Copy & Design approval — hidden for locked creatives */}
        {!isLocked && (
          <>
            <Card className="border-border/40">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback da Copy" : "Aprovação da Copy"}</h3>
                  {!isResubmission && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie a clareza, persuasão e alinhamento com o objetivo.</p>
                  )}
                </div>
                {!isResubmission && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Sua avaliação:</span>
                    <StarRating
                      value={r.copyRating}
                      hovered={r.copyHovered}
                      onChange={(v) => updateRating(idx, { copyRating: v })}
                      onHover={(v) => updateRating(idx, { copyHovered: v })}
                      onLeave={() => updateRating(idx, { copyHovered: 0 })}
                      disabled={submitting}
                    />
                  </div>
                )}
                <Textarea
                  value={r.copyComment}
                  onChange={(e) => updateRating(idx, { copyComment: e.target.value })}
                  placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Escreva aqui seu feedback sobre a copy (texto, mensagem, CTA...)"}
                  rows={3}
                  disabled={submitting}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback do Design" : "Aprovação do Design"}</h3>
                  {!isResubmission && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie cores, layout, legibilidade e impacto visual.</p>
                  )}
                </div>
                {!isResubmission && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Sua avaliação:</span>
                    <StarRating
                      value={r.designRating}
                      hovered={r.designHovered}
                      onChange={(v) => updateRating(idx, { designRating: v })}
                      onHover={(v) => updateRating(idx, { designHovered: v })}
                      onLeave={() => updateRating(idx, { designHovered: 0 })}
                      disabled={submitting}
                    />
                  </div>
                )}
                <Textarea
                  value={r.designComment}
                  onChange={(e) => updateRating(idx, { designComment: e.target.value })}
                  placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Escreva aqui seu feedback sobre o design (cores, imagens, layout...)"}
                  rows={3}
                  disabled={submitting}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Per-creative action buttons */}
            {isStatic && creativeCount > 1 && (
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleCreativeAction(idx, "em_ajustes")}
                  disabled={submitting}
                  className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  size="sm"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Solicitar alteração
                </Button>
                <Button
                  onClick={() => handleCreativeAction(idx, "aprovado")}
                  disabled={submitting}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Aprovado
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ── Render a VIDEO block (per-video) ──
  const renderVideoBlock = (idx: number) => {
    const r = getRating(idx);
    const video = getVideoForIndex(idx);
    const videoCaption = videoCaptions[idx] || "";
    const cStatus = creativeStatuses[idx];
    const isLocked = isCreativeApproved(idx);

    return (
      <div className="space-y-6">
        {/* Approved badge */}
        {isLocked && (
          <Badge className="bg-emerald-600 text-white">✅ Já aprovado</Badge>
        )}
        {!isLocked && cStatus && (
          <Badge variant={cStatus === "aprovado" ? "default" : "destructive"} className={cStatus === "aprovado" ? "bg-emerald-600" : ""}>
            {cStatus === "aprovado" ? "✓ Aprovado" : "⚠ Ajuste solicitado"}
          </Badge>
        )}

        {/* Video mockup 9:16 */}
        <Card className="border-border/40">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-sm font-bold text-foreground">Vídeo {idx + 1}</h3>
            </div>
            <div className="flex justify-center">
              {video ? (
                <VideoStoryPreview
                  videoUrl={video.url}
                  clientName={job.client_name || "Cliente"}
                />
              ) : (
                <div
                  className="relative overflow-hidden rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-3"
                  style={{ width: 270, aspectRatio: "9/16", background: "hsl(var(--muted))" }}
                >
                  <Film className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground/60 text-sm text-center px-4">Nenhum vídeo anexado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Caption */}
        {videoCaption && (
          <Card className="border-border/40">
            <CardContent className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground">Legenda do Vídeo {idx + 1}</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{videoCaption}</p>
            </CardContent>
          </Card>
        )}

        {/* Copy & Design approval — hidden for locked */}
        {!isLocked && (
          <>
            <Card className="border-border/40">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback da Copy" : "Aprovação da Copy"}</h3>
                  {!isResubmission && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie a clareza, persuasão e alinhamento com o objetivo.</p>
                  )}
                </div>
                {!isResubmission && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Sua avaliação:</span>
                    <StarRating value={r.copyRating} hovered={r.copyHovered}
                      onChange={(v) => updateRating(idx, { copyRating: v })}
                      onHover={(v) => updateRating(idx, { copyHovered: v })}
                      onLeave={() => updateRating(idx, { copyHovered: 0 })} disabled={submitting} />
                  </div>
                )}
                <Textarea value={r.copyComment} onChange={(e) => updateRating(idx, { copyComment: e.target.value })}
                  placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre a copy..."} rows={3} disabled={submitting} className="resize-none" />
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback do Design" : "Aprovação do Design"}</h3>
                  {!isResubmission && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie cores, edição, legibilidade e impacto visual.</p>
                  )}
                </div>
                {!isResubmission && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Sua avaliação:</span>
                    <StarRating value={r.designRating} hovered={r.designHovered}
                      onChange={(v) => updateRating(idx, { designRating: v })}
                      onHover={(v) => updateRating(idx, { designHovered: v })}
                      onLeave={() => updateRating(idx, { designHovered: 0 })} disabled={submitting} />
                  </div>
                )}
                <Textarea value={r.designComment} onChange={(e) => updateRating(idx, { designComment: e.target.value })}
                  placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre o design/edição..."} rows={3} disabled={submitting} className="resize-none" />
              </CardContent>
            </Card>

            {/* Per-video action buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleCreativeAction(idx, "em_ajustes")}
                disabled={submitting} className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10" size="sm">
                <Pencil className="h-3.5 w-3.5" /> Solicitar alteração
              </Button>
              <Button onClick={() => handleCreativeAction(idx, "aprovado")}
                disabled={submitting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Landing Page helpers ──
  const lpFileUrl = useMemo(() => {
    // Try attached_files first
    const attached = job.attached_files || [];
    const lpFile = attached.find((f: any) => {
      const t = f?.type || "";
      return t.startsWith("image/") || t === "application/pdf" || t.startsWith("application/");
    });
    if (lpFile) return lpFile.url || lpFile.fileUrl || lpFile.src || lpFile.path || lpFile.downloadUrl;
    // Fallback fields
    return (job as any).lpArquivo?.url || (job as any).landingPageArquivo?.url || (job as any).arquivoLP?.url
      || (job as any).pdfUrl || (job as any).imageUrl || (job as any).anexoUrl || null;
  }, [job]);

  const lpFileType = useMemo(() => {
    if (!lpFileUrl) return null;
    const attached = job.attached_files || [];
    const lpFile = attached.find((f: any) => {
      const url = f?.url || f?.fileUrl || "";
      return url === lpFileUrl;
    });
    if (lpFile?.type === "application/pdf") return "pdf";
    if (lpFile?.type?.startsWith("image/")) return "imagem";
    if ((job as any).lpArquivo?.tipo) return (job as any).lpArquivo.tipo;
    if (lpFileUrl.toLowerCase().endsWith(".pdf")) return "pdf";
    return "imagem";
  }, [lpFileUrl, job]);

  const lpLink = useMemo(() => {
    return (job as any).lpLink || (job as any).urlLP || (job as any).linkLandingPage
      || (job as any).link || (job as any).landing_page_link || "";
  }, [job]);

  const renderLandingPageBlock = () => (
    <div className="space-y-6">
      {/* LP Link card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Link da Landing Page</h3>
          </div>
          <p className="text-xs text-muted-foreground">Acesse a página para revisar e validar o conteúdo final.</p>
          {lpLink ? (
            <div className="space-y-2">
              <a href={lpLink} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary underline truncate block max-w-full" title={lpLink}>
                {lpLink.length > 60 ? lpLink.substring(0, 60) + "…" : lpLink}
              </a>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                  onClick={() => { navigator.clipboard.writeText(lpLink); toast({ title: "Link copiado!" }); }}>
                  <Copy className="h-3 w-3" /> Copiar link
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                  <a href={lpLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" /> Abrir em nova aba
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Link ainda não informado.</p>
          )}
        </CardContent>
      </Card>

      {/* File preview */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-sm font-bold text-foreground">Preview do Arquivo</h3>
          </div>
          {lpFileUrl ? (
            lpFileType === "pdf" ? (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs bg-background/80 backdrop-blur-sm" asChild>
                    <a href={lpFileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> Abrir PDF
                    </a>
                  </Button>
                </div>
                <iframe src={lpFileUrl} className="w-full rounded-lg border border-border/30" style={{ height: 600 }} title="PDF Preview" />
              </div>
            ) : (
              <div className="flex justify-center">
                <img src={lpFileUrl} alt="Landing Page Preview" className="max-w-full rounded-lg border border-border/30 object-contain" style={{ maxHeight: 520 }} />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground gap-2">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              Nenhum arquivo anexado nesta Landing Page
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copy approval (no caption block for LP) */}
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback da copy" : "Aprovação da copy"}</h3>
            {!isResubmission && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie o texto e a mensagem do material.</p>
            )}
          </div>
          {!isResubmission && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Sua avaliação:</span>
              <StarRating value={copyRating} hovered={copyHovered} onChange={setCopyRating} onHover={setCopyHovered} onLeave={() => setCopyHovered(0)} disabled={submitting} />
            </div>
          )}
          <Textarea value={copyComment} onChange={(e) => setCopyComment(e.target.value)}
            placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre a copy..."} rows={3} disabled={submitting} className="resize-none" />
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback do design" : "Aprovação do design"}</h3>
            {!isResubmission && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie o visual e layout da Landing Page.</p>
            )}
          </div>
          {!isResubmission && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Sua avaliação:</span>
              <StarRating value={designRating} hovered={designHovered} onChange={setDesignRating} onHover={setDesignHovered} onLeave={() => setDesignHovered(0)} disabled={submitting} />
            </div>
          )}
          <Textarea value={designComment} onChange={(e) => setDesignComment(e.target.value)}
            placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre o design/layout..."} rows={3} disabled={submitting} className="resize-none" />
        </CardContent>
      </Card>
    </div>
  );

  const renderLegacySingleBlock = () => (
    <div className="space-y-6">
      {/* Material preview */}
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-sm font-bold text-foreground">Revisão de materiais</h3>
            {imageFiles.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">Role para o lado para ver todas as versões</p>
            )}
          </div>
          {imageFiles.length > 0 ? (
            <div className="flex justify-center">
              <InstagramPostPreview images={imageFiles} description={caption} clientName={job.client_name || "Cliente"} hideMoreButton />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
              Nenhuma imagem anexada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Caption */}
      {(job.caption || job.description) && (
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Legenda do criativo</h3>
            {job.caption && <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.caption}</p>}
            {job.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>
            )}
            {job.landing_page_link && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Landing Page</p>
                <a href={job.landing_page_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{job.landing_page_link}</a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Copy approval */}
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback da copy" : "Aprovação da copy"}</h3>
            {!isResubmission && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie o texto e a mensagem do material. Considere clareza, persuasão e alinhamento com o objetivo.</p>
            )}
          </div>
          {!isResubmission && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Sua avaliação:</span>
              <StarRating value={copyRating} hovered={copyHovered} onChange={setCopyRating} onHover={setCopyHovered} onLeave={() => setCopyHovered(0)} disabled={submitting} />
            </div>
          )}
          <Textarea value={copyComment} onChange={(e) => setCopyComment(e.target.value)}
            placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Escreva aqui seu feedback sobre a copy (texto, mensagem, CTA...)"} rows={3} disabled={submitting} className="resize-none" />
        </CardContent>
      </Card>

      {/* Design approval */}
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">{isResubmission ? "Feedback do design" : "Aprovação do design"}</h3>
            {!isResubmission && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Avalie o visual do material. Considere cores, layout, legibilidade e impacto visual.</p>
            )}
          </div>
          {!isResubmission && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Sua avaliação:</span>
              <StarRating value={designRating} hovered={designHovered} onChange={setDesignRating} onHover={setDesignHovered} onLeave={() => setDesignHovered(0)} disabled={submitting} />
            </div>
          )}
          <Textarea value={designComment} onChange={(e) => setDesignComment(e.target.value)}
            placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Escreva aqui seu feedback sobre o design (cores, imagens, layout...)"} rows={3} disabled={submitting} className="resize-none" />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Page header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <h2 className="text-lg font-bold text-foreground">Aprovação de materiais</h2>
          <p className="text-sm text-muted-foreground">Revise os materiais e envie seu feedback ou aprovação</p>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Info badges */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="text-sm font-semibold text-foreground">{job.client_name || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Campanha</p>
                    <p className="text-sm font-semibold text-foreground">{job.title || "Sem título"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DEBUG BLOCK — temporary (video only) */}

          {/* Per-creative with tabs, per-video with tabs, or single/legacy */}
          {isVideo ? (
            <Tabs value={activeCreativeTab} onValueChange={setActiveCreativeTab} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
                {Array.from({ length: creativeCount }, (_, i) => (
                  <TabsTrigger
                    key={i}
                    value={String(i)}
                    className={`flex-1 min-w-[100px] gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_8px_hsl(var(--primary)/0.3)] data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isCreativeApproved(i) ? "opacity-60" : ""}`}
                  >
                    Vídeo {i + 1}
                    {isCreativeApproved(i) ? (
                      <span className="text-emerald-500 text-xs">✅</span>
                    ) : creativeStatuses[i] ? (
                      <span className={`w-2 h-2 rounded-full ${creativeStatuses[i] === "aprovado" ? "bg-emerald-500" : "bg-destructive"}`} />
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Array.from({ length: creativeCount }, (_, i) => (
                <TabsContent key={i} value={String(i)} className="mt-4">
                  {renderVideoBlock(i)}
                </TabsContent>
              ))}
            </Tabs>
          ) : isStatic && creativeCount > 1 ? (
            <Tabs value={activeCreativeTab} onValueChange={setActiveCreativeTab} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
                {Array.from({ length: creativeCount }, (_, i) => (
                  <TabsTrigger
                    key={i}
                    value={String(i)}
                    className={`flex-1 min-w-[100px] gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_8px_hsl(var(--primary)/0.3)] data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isCreativeApproved(i) ? "opacity-60" : ""}`}
                  >
                    Criativo {i + 1}
                    {isCreativeApproved(i) ? (
                      <span className="text-emerald-500 text-xs">✅</span>
                    ) : creativeStatuses[i] ? (
                      <span className={`w-2 h-2 rounded-full ${creativeStatuses[i] === "aprovado" ? "bg-emerald-500" : "bg-destructive"}`} />
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Array.from({ length: creativeCount }, (_, i) => (
                <TabsContent key={i} value={String(i)} className="mt-4">
                  {renderCreativeBlock(i)}
                </TabsContent>
              ))}
            </Tabs>
          ) : isStatic ? (
            renderCreativeBlock(0)
          ) : isLandingPage ? (
            renderLandingPageBlock()
          ) : (
            renderLegacySingleBlock()
          )}

          {/* Global action buttons */}
          <div className="flex justify-between items-center gap-3 pb-2">
            {(isStatic && creativeCount > 1 || isVideo) && (
              <p className="text-xs text-muted-foreground">
                {Object.keys(creativeStatuses).filter(k => pendingCreativeIndices.includes(Number(k))).length} de {pendingCreativeIndices.length} {isVideo ? "vídeos" : "criativos"} avaliados
                {approvedCreativeIndices.size > 0 && ` (${approvedCreativeIndices.size} já aprovado${approvedCreativeIndices.size > 1 ? 's' : ''})`}
              </p>
            )}
            <div className="flex gap-3 ml-auto">
              {(isStatic && creativeCount > 1) || isVideo ? (
                <Button
                  onClick={() => {
                    const hasAdjustment = Object.values(creativeStatuses).some(s => s === "em_ajustes");
                    handleSubmit(hasAdjustment ? "em_ajustes" : "aprovado");
                  }}
                  disabled={submitting || !allCreativesEvaluated}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? "Enviando..." : "Enviar avaliação"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit("em_ajustes")}
                    disabled={submitting}
                    className="gap-2 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Pencil className="h-4 w-4" />
                    Enviar alteração
                  </Button>
                  <Button
                    onClick={() => handleSubmit("aprovado")}
                    disabled={submitting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Aprovado
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
