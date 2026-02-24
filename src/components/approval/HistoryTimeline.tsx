import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Star,
  AlertOctagon,
  Eye,
  ExternalLink,
  Download,
  FileImage,
  File as FileIcon,
} from "lucide-react";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { InstagramStoryPreview } from "./InstagramStoryPreview";
import { VideoStoryPreview } from "./VideoStoryPreview";
import {
  type ApprovalJobData,
  type ApprovalContentVersion,
  type CreativeEvaluation,
  type SentVersionRecord,
  getContentVersions,
  getSentVersions,
} from "@/services/approvalDataService";

interface HistoryTimelineProps {
  job: ApprovalJobData & Record<string, any>;
  clientFeedback: any[];
}

// ── Event type config ──
const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; borderColor: string; label: string }> = {
  cadastrado: {
    icon: <FileText className="h-4 w-4" />,
    color: "bg-muted text-muted-foreground",
    borderColor: "border-muted-foreground/30",
    label: "Cadastrado",
  },
  enviado: {
    icon: <Send className="h-4 w-4" />,
    color: "bg-blue-500/15 text-blue-500",
    borderColor: "border-blue-500/40",
    label: "Enviado para aprovação",
  },
  ajuste: {
    icon: <AlertOctagon className="h-4 w-4" />,
    color: "bg-red-500/15 text-red-500",
    borderColor: "border-red-500/40",
    label: "AJUSTE SOLICITADO",
  },
  aprovado: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-500/15 text-emerald-500",
    borderColor: "border-emerald-500/40",
    label: "Aprovado",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function StarRow({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-12">{label}:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25"}`}
          />
        ))}
      </div>
    </div>
  );
}

function MiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-2.5 w-2.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25"}`} />
      ))}
    </div>
  );
}

/** Build fallback versions from feedback when no stored versions exist */
function buildFallbackVersions(
  job: ApprovalJobData & Record<string, any>,
  feedbackList: any[]
): ApprovalContentVersion[] {
  const sorted = [...feedbackList].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );
  return sorted.map((fb, idx) => ({
    version_number: idx + 1,
    created_at: fb.submitted_at,
    snapshot: {
      files: (job as any).attached_files || [],
      caption: (job as any).caption || null,
      material_type: (job as any).material_type || "estaticos",
    },
    feedback: {
      copy_rating: fb.copy_rating || 0,
      copy_comment: fb.copy_comment || "",
      design_rating: fb.design_rating || 0,
      design_comment: fb.design_comment || "",
      client_name: fb.client_name || "Cliente",
      status_at_feedback: fb.approval_status || "em_ajustes",
      per_creative: fb.per_creative?.map((pc: any) => ({
        creative_index: pc.creative_index,
        copy_rating: pc.copy_rating || 0,
        copy_comment: pc.copy_comment || "",
        design_rating: pc.design_rating || 0,
        design_comment: pc.design_comment || "",
        decision: pc.status || "em_ajustes",
        decided_at: fb.submitted_at,
      })),
    },
  }));
}

// ── Per-Creative Summary Row (used in timeline) ──
function CreativeSummaryRow({
  eval: ev,
  onViewClick,
  itemLabel,
}: {
  eval: CreativeEvaluation;
  onViewClick: () => void;
  itemLabel?: string;
}) {
  const isApproved = ev.decision === "aprovado";
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onViewClick}
    >
      {isApproved ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <AlertOctagon className="h-3.5 w-3.5 text-red-500 shrink-0" />
      )}
      <span className="text-xs font-medium text-foreground">{itemLabel || `Criativo ${ev.creative_index + 1}`}</span>
      <Badge
        variant="outline"
        className={`text-[9px] px-1.5 py-0 ${
          isApproved
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            : "bg-red-500/10 text-red-500 border-red-500/30"
        }`}
      >
        {isApproved ? "Aprovado" : "Ajuste"}
      </Badge>
      {ev.copy_rating > 0 && (
        <div className="flex items-center gap-1 ml-1">
          <span className="text-[10px] text-muted-foreground">Copy</span>
          <MiniStars rating={ev.copy_rating} />
        </div>
      )}
      {ev.design_rating > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Design</span>
          <MiniStars rating={ev.design_rating} />
        </div>
      )}
      <Eye className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
    </div>
  );
}

// ── Landing Page Version Detail View ──
function LandingPageVersionDetailView({
  version,
  onBack,
  job,
}: {
  version: ApprovalContentVersion;
  onBack: () => void;
  job?: ApprovalJobData & Record<string, any>;
}) {
  const snapshot = version.snapshot as any;
  const feedback = version.feedback;
  const isAdjust = feedback.status_at_feedback === "em_ajustes";

  // Extract LP link — snapshot first, then fallback to current job
  const lpLink = snapshot.landing_page_link || snapshot.lpLink || (job as any)?.landing_page_link || (job as any)?.lpLink || "";

  // Extract LP file
  const allFiles = snapshot.files || [];
  const lpFile = allFiles[0] || null;
  const lpFileUrl = lpFile?.url || lpFile?.fileUrl || snapshot.lpArquivo?.url || snapshot.pdfUrl || snapshot.imageUrl || "";
  const lpFileName = lpFile?.name || snapshot.lpArquivo?.nome || (() => {
    try { return decodeURIComponent(lpFileUrl.split("/").pop()?.split("?")[0] || ""); } catch { return ""; }
  })();
  const isPdf = lpFile?.type === "application/pdf" || lpFileUrl.toLowerCase().includes(".pdf");

  // Extract context
  const context = snapshot.caption || snapshot.contexto || "";

  const copyRating = feedback.copy_rating;
  const copyComment = feedback.copy_comment;
  const designRating = feedback.design_rating;
  const designComment = feedback.design_comment;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao histórico
      </Button>

      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-foreground">
          Versão {version.version_number} — Revisão da Landing Page
        </h3>
        <p className="text-xs text-muted-foreground">{formatDate(version.created_at)}</p>
        <Badge
          variant="outline"
          className={`mt-2 text-[10px] px-1.5 py-0 font-semibold ${
            isAdjust
              ? "bg-red-500/10 text-red-500 border-red-500/30"
              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
          }`}
        >
          {isAdjust ? "AJUSTE SOLICITADO" : "APROVADO"}
        </Badge>
      </div>

      {/* Link da Landing Page */}
      <Card className="border-border/40">
        <CardContent className="p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Link da Landing Page</h4>
          {lpLink ? (
            <div className="flex items-center gap-2">
              <a
                href={lpLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline truncate flex-1"
              >
                {lpLink}
              </a>
              <a href={lpLink} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary shrink-0" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Link não informado nesta versão.</p>
          )}
        </CardContent>
      </Card>

      {/* Arquivo Anexado */}
      <Card className="border-border/40">
        <CardContent className="p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Arquivo Anexado</h4>
          {lpFileUrl ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isPdf ? (
                  <FileIcon className="h-5 w-5 text-red-500 shrink-0" />
                ) : (
                  <FileImage className="h-5 w-5 text-blue-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{lpFileName || "Arquivo"}</p>
                  <p className="text-xs text-muted-foreground">{isPdf ? "PDF" : "Imagem"}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
                <a href={lpFileUrl} download target="_blank" rel="noreferrer">
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum arquivo anexado nesta versão.</p>
          )}
        </CardContent>
      </Card>

      {/* Contexto do material */}
      {context && (
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Contexto do material</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{context}</p>
          </CardContent>
        </Card>
      )}

      {/* Avaliação */}
      <Card className={`border-border/40 ${isAdjust ? "border-red-500/30" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Avaliação</h4>
          <p className="text-sm font-medium text-foreground">{feedback.client_name}</p>
          <div className="space-y-2">
            <StarRow rating={copyRating} label="Copy" />
            <div className={`rounded-md px-3 py-2 text-xs italic ${
              isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/50 text-muted-foreground"
            }`}>
              {copyComment ? `"${copyComment}"` : "Sem comentário"}
            </div>
            <StarRow rating={designRating} label="Design" />
            <div className={`rounded-md px-3 py-2 text-xs italic ${
              isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/50 text-muted-foreground"
            }`}>
              {designComment ? `"${designComment}"` : "Sem comentário"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Version Detail View (with creative tabs) ──
function VersionDetailView({
  version,
  onBack,
  initialCreativeIndex,
  job,
}: {
  version: ApprovalContentVersion;
  onBack: () => void;
  initialCreativeIndex?: number;
  job?: ApprovalJobData & Record<string, any>;
}) {
  // Landing Page gets its own dedicated view
  if (version.snapshot.material_type === "landing_page") {
    return <LandingPageVersionDetailView version={version} onBack={onBack} job={job} />;
  }

  const perCreative = version.feedback.per_creative || [];
  const creativeSnapshots = version.snapshot.creatives || [];

  // Derive actual creative indices present in this version
  const versionCreativeIndices = useMemo(() => {
    const fromEvals = perCreative.map(pc => pc.creative_index);
    if (fromEvals.length > 0) return fromEvals;
    const fromSnapshots = creativeSnapshots.map(cs => cs.creative_index);
    if (fromSnapshots.length > 0) return fromSnapshots;
    const count = version.snapshot.static_creative_count || 1;
    return Array.from({ length: count }, (_, i) => i);
  }, [perCreative, creativeSnapshots, version.snapshot.static_creative_count]);

  const hasMultipleCreatives = versionCreativeIndices.length > 1;

  // Ensure initial index is valid within this version's creative indices
  const resolvedInitial = useMemo(() => {
    if (initialCreativeIndex != null && versionCreativeIndices.includes(initialCreativeIndex)) {
      return initialCreativeIndex;
    }
    return versionCreativeIndices[0] ?? 0;
  }, [initialCreativeIndex, versionCreativeIndices]);
  const [activeCreative, setActiveCreative] = useState(String(resolvedInitial));
  const [activeSlot, setActiveSlot] = useState<"feed" | "story">("feed");

  const currentIdx = parseInt(activeCreative) || 0;

  // Detect if this version is for videos
  const isVideoVersion = version.snapshot.material_type === "videos";

  // For videos, extract video files from snapshot
  const videoExt = ["mp4", "mov", "webm", "m4v"];
  const versionVideoFiles = useMemo(() => {
    if (!isVideoVersion) return [];
    const files = version.snapshot.files || [];
    return files.filter((f: any) => {
      if (f?.type?.startsWith("video/")) return true;
      const ext = (f?.url || f?.fileUrl || f?.src || f?.path || "").split(".").pop()?.toLowerCase();
      return ext ? videoExt.includes(ext) : false;
    });
  }, [isVideoVersion, version.snapshot.files]);

  // Version summary
  const approvedCount = perCreative.filter(pc => pc.decision === "aprovado").length;
  const adjustCount = perCreative.filter(pc => pc.decision === "em_ajustes").length;

  // Get current creative data — find by creative_index, not array position
  const currentSnapshot = creativeSnapshots.find(cs => cs.creative_index === currentIdx);
  const currentEval = perCreative.find(pc => pc.creative_index === currentIdx);
  const isAdjust = currentEval ? currentEval.decision === "em_ajustes" : version.feedback.status_at_feedback === "em_ajustes";

  // Images for current creative
  const allFiles = version.snapshot.files || [];
  const feedImage = currentSnapshot?.feed_file
    || allFiles.filter((f: any) => f?.creative === currentIdx + 1 && f?.slot === "feed");
  const storyImage = currentSnapshot?.story_file
    || allFiles.filter((f: any) => f?.creative === currentIdx + 1 && f?.slot === "story");

  // For single creative, use all images
  const singleCreativeImages = !hasMultipleCreatives
    ? allFiles.filter((f: any) => f?.type?.startsWith("image/")).map((f: any) => ({ url: f.url, name: f.name }))
    : [];

  const currentCaption = currentSnapshot?.caption
    || version.snapshot.static_captions?.[currentIdx]
    || version.snapshot.caption
    || "";

  const currentCopyRating = currentEval?.copy_rating ?? version.feedback.copy_rating;
  const currentCopyComment = currentEval?.copy_comment ?? version.feedback.copy_comment;
  const currentDesignRating = currentEval?.design_rating ?? version.feedback.design_rating;
  const currentDesignComment = currentEval?.design_comment ?? version.feedback.design_comment;
  const currentDecision = currentEval?.decision ?? version.feedback.status_at_feedback;

  // Resolve images for display
  const getDisplayImages = () => {
    if (!hasMultipleCreatives) {
      return singleCreativeImages;
    }
    if (activeSlot === "feed") {
      if (feedImage && !Array.isArray(feedImage)) return [{ url: feedImage.url, name: feedImage.name }];
      if (Array.isArray(feedImage) && feedImage.length > 0) return feedImage.map((f: any) => ({ url: f.url, name: f.name }));
    } else {
      if (storyImage && !Array.isArray(storyImage)) return [{ url: storyImage.url, name: storyImage.name }];
      if (Array.isArray(storyImage) && storyImage.length > 0) return storyImage.map((f: any) => ({ url: f.url, name: f.name }));
    }
    return [];
  };

  const displayImages = getDisplayImages();

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao histórico
      </Button>

      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Versão {version.version_number} — Revisão por {isVideoVersion ? "Vídeos" : "Criativos"}
          </h3>
          <p className="text-xs text-muted-foreground">{formatDate(version.created_at)}</p>
        </div>
      </div>

      {/* Version summary */}
      {hasMultipleCreatives && perCreative.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span className="font-medium text-foreground">Resumo da Versão {version.version_number}:</span>
          {approvedCount > 0 && (
            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 px-1.5 py-0">
              {approvedCount} aprovado{approvedCount > 1 ? "s" : ""}
            </Badge>
          )}
          {adjustCount > 0 && (
            <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-500 border-red-500/30 px-1.5 py-0">
              {adjustCount} com ajuste
            </Badge>
          )}
        </div>
      )}

      {/* Creative/Video tabs */}
      <Tabs
        value={versionCreativeIndices.includes(parseInt(activeCreative)) ? activeCreative : String(versionCreativeIndices[0] ?? 0)}
        onValueChange={(v) => { setActiveCreative(v); if (!isVideoVersion) setActiveSlot("feed"); }}
      >
        {versionCreativeIndices.length > 1 && (
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
            {versionCreativeIndices.map((creativeIdx) => {
              const ev = perCreative.find(pc => pc.creative_index === creativeIdx);
              const evIsApproved = ev?.decision === "aprovado";
              return (
                <TabsTrigger
                  key={creativeIdx}
                  value={String(creativeIdx)}
                  className="flex-1 min-w-[100px] gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_8px_hsl(var(--primary)/0.3)] data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {isVideoVersion ? `Vídeo ${creativeIdx + 1}` : `Criativo ${creativeIdx + 1}`}
                  {ev && (
                    <span className={`w-2 h-2 rounded-full ${evIsApproved ? "bg-emerald-500" : "bg-red-500"}`} />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        {versionCreativeIndices.map((creativeIdx) => {
          const tabEval = perCreative.find(pc => pc.creative_index === creativeIdx);
          const tabSnapshot = creativeSnapshots.find(cs => cs.creative_index === creativeIdx);

          const tabCaption = tabSnapshot?.caption
            || version.snapshot.static_captions?.[creativeIdx]
            || (version.snapshot as any).video_captions?.[creativeIdx]
            || version.snapshot.caption || "";

          if (isVideoVersion) {
            // Video version rendering
            const videoFile = versionVideoFiles.find((f: any) => f.creative === creativeIdx + 1) || versionVideoFiles[creativeIdx];
            const videoUrl = videoFile ? (videoFile.url || videoFile.fileUrl || videoFile.src || videoFile.path || videoFile.downloadUrl || "") : "";

            return (
              <TabsContent key={creativeIdx} value={String(creativeIdx)} className="mt-4 space-y-4">
                <VersionVideoPreviewContent
                  videoUrl={videoUrl}
                  caption={tabCaption}
                  clientName={version.feedback.client_name}
                  itemIndex={creativeIdx}
                  copyRating={tabEval?.copy_rating ?? version.feedback.copy_rating}
                  copyComment={tabEval?.copy_comment ?? version.feedback.copy_comment}
                  designRating={tabEval?.design_rating ?? version.feedback.design_rating}
                  designComment={tabEval?.design_comment ?? version.feedback.design_comment}
                  decision={tabEval?.decision ?? version.feedback.status_at_feedback}
                />
              </TabsContent>
            );
          }

          // Static version rendering (unchanged)
          const tabFeedImage = tabSnapshot?.feed_file
            || allFiles.filter((f: any) => f?.creative === creativeIdx + 1 && f?.slot === "feed");
          const tabStoryImage = tabSnapshot?.story_file
            || allFiles.filter((f: any) => f?.creative === creativeIdx + 1 && f?.slot === "story");

          const fallbackImages = versionCreativeIndices.length === 1
            ? allFiles.filter((f: any) => f?.type?.startsWith("image/")).map((f: any) => ({ url: f.url, name: f.name }))
            : [];

          const getTabImages = () => {
            if (activeSlot === "feed") {
              if (tabFeedImage && !Array.isArray(tabFeedImage)) return [{ url: tabFeedImage.url, name: tabFeedImage.name }];
              if (Array.isArray(tabFeedImage) && tabFeedImage.length > 0) return tabFeedImage.map((f: any) => ({ url: f.url, name: f.name }));
              if (fallbackImages.length > 0) return fallbackImages;
            } else {
              if (tabStoryImage && !Array.isArray(tabStoryImage)) return [{ url: tabStoryImage.url, name: tabStoryImage.name }];
              if (Array.isArray(tabStoryImage) && tabStoryImage.length > 0) return tabStoryImage.map((f: any) => ({ url: f.url, name: f.name }));
            }
            return [];
          };

          return (
            <TabsContent key={creativeIdx} value={String(creativeIdx)} className="mt-4 space-y-4">
              {/* Feed / Story toggle — only for statics */}
              <div className="flex justify-center">
                <div className="inline-flex bg-muted rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setActiveSlot("feed")}
                    className={`px-5 py-1.5 text-sm rounded-md transition-all ${activeSlot === "feed" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Feed
                  </button>
                  <button
                    onClick={() => setActiveSlot("story")}
                    className={`px-5 py-1.5 text-sm rounded-md transition-all ${activeSlot === "story" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Story
                  </button>
                </div>
              </div>

              {/* Preview */}
              <VersionPreviewContent
                displayImages={getTabImages()}
                activeSlot={activeSlot}
                caption={tabCaption}
                clientName={version.feedback.client_name}
                creativeIndex={creativeIdx}
                copyRating={tabEval?.copy_rating ?? version.feedback.copy_rating}
                copyComment={tabEval?.copy_comment ?? version.feedback.copy_comment}
                designRating={tabEval?.design_rating ?? version.feedback.design_rating}
                designComment={tabEval?.design_comment ?? version.feedback.design_comment}
                decision={tabEval?.decision ?? version.feedback.status_at_feedback}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// ── Video preview + feedback content for version detail ──
function VersionVideoPreviewContent({
  videoUrl,
  caption,
  clientName,
  itemIndex,
  copyRating,
  copyComment,
  designRating,
  designComment,
  decision,
}: {
  videoUrl: string;
  caption: string;
  clientName: string;
  itemIndex: number;
  copyRating: number;
  copyComment: string;
  designRating: number;
  designComment: string;
  decision: string;
}) {
  const isAdjust = decision === "em_ajustes";

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            Preview do material (Vídeo)
          </h4>
          {videoUrl ? (
            <div className="flex justify-center">
              <VideoStoryPreview videoUrl={videoUrl} clientName={clientName} />
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="flex items-center justify-center rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground"
                style={{ width: 270, aspectRatio: "9/16", background: "hsl(var(--muted))" }}
              >
                Nenhum vídeo nesta versão
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Caption */}
      {caption && (
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Legenda do Vídeo {itemIndex + 1}
            </h4>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{caption}</p>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card className={`border-border/40 ${isAdjust ? "border-red-500/30" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Status do Vídeo {itemIndex + 1}
            </h4>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-semibold ${
                isAdjust
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              }`}
            >
              {isAdjust ? "AJUSTE SOLICITADO" : "APROVADO"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation */}
      <Card className={`border-border/40 ${isAdjust ? "border-red-500/30" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Avaliação do Vídeo {itemIndex + 1}
          </h4>
          <p className="text-sm font-medium text-foreground">{clientName}</p>
          <div className="space-y-2">
            <StarRow rating={copyRating} label="Copy" />
            <div className={`rounded-md px-3 py-2 text-xs italic ${
              isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/50 text-muted-foreground"
            }`}>
              {copyComment ? `"${copyComment}"` : "Sem comentário"}
            </div>
            <StarRow rating={designRating} label="Design" />
            <div className={`rounded-md px-3 py-2 text-xs italic ${
              isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/50 text-muted-foreground"
            }`}>
              {designComment ? `"${designComment}"` : "Sem comentário"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Shared preview + feedback content for version detail ──
function VersionPreviewContent({
  displayImages,
  activeSlot,
  caption,
  clientName,
  creativeIndex,
  copyRating,
  copyComment,
  designRating,
  designComment,
  decision,
}: {
  displayImages: { url: string; name: string }[];
  activeSlot: "feed" | "story";
  caption: string;
  clientName: string;
  creativeIndex: number;
  copyRating: number;
  copyComment: string;
  designRating: number;
  designComment: string;
  decision: string;
}) {
  const isAdjust = decision === "em_ajustes";

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            Preview do material {activeSlot === "story" ? "(Story)" : "(Feed)"}
          </h4>
          {displayImages.length > 0 ? (
            activeSlot === "story" ? (
              <InstagramStoryPreview
                images={displayImages}
                clientName={clientName}
              />
            ) : (
              <div className="flex justify-center">
                <InstagramPostPreview
                  images={displayImages}
                  description={caption}
                  clientName={clientName}
                  hideMoreButton
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
              Nenhuma imagem nesta versão
            </div>
          )}
        </CardContent>
      </Card>

      {/* Caption */}
      {caption && (
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Legenda do Criativo {creativeIndex + 1}
            </h4>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{caption}</p>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card className={`border-border/40 ${isAdjust ? "border-red-500/30" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Status do Criativo {creativeIndex + 1}
            </h4>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-semibold ${
                isAdjust
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              }`}
            >
              {isAdjust ? "AJUSTE SOLICITADO" : "APROVADO"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation */}
      <Card className={`border-border/40 ${isAdjust ? "border-red-500/30" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Avaliação do Criativo {creativeIndex + 1}
          </h4>
          <p className="text-sm font-medium text-foreground">{clientName}</p>
          <div className="space-y-2">
            <StarRow rating={copyRating} label="Copy" />
            <div className={`rounded-md px-3 py-2 text-xs italic ${
              isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/50 text-muted-foreground"
            }`}>
              {copyComment ? `"${copyComment}"` : "Sem comentário"}
            </div>
            <StarRow rating={designRating} label="Design" />
            <div className={`rounded-md px-3 py-2 text-xs italic ${
              isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/50 text-muted-foreground"
            }`}>
              {designComment ? `"${designComment}"` : "Sem comentário"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HistoryTimeline({ job, clientFeedback }: HistoryTimelineProps) {
  const [selectedVersion, setSelectedVersion] = useState<ApprovalContentVersion | null>(null);
  const [initialCreativeIdx, setInitialCreativeIdx] = useState<number>(0);

  // Get stored versions, fallback to generated ones from feedback
  const [versions, setVersions] = useState<ApprovalContentVersion[]>([]);
  useEffect(() => {
    getContentVersions(job.id).then(stored => {
      if (stored.length > 0) { setVersions(stored); }
      else { setVersions(buildFallbackVersions(job, clientFeedback)); }
    });
  }, [job, clientFeedback]);

  // Sent versions loaded async
  const [sentVersions, setSentVersions] = useState<SentVersionRecord[]>([]);
  useEffect(() => { getSentVersions(job.id).then(setSentVersions); }, [job.id]);

  // Build timeline events
  const events = useMemo(() => {
    const items: {
      type: string;
      date: string;
      feedback?: any;
      versionNumber?: number;
      sentCreativeIndices?: number[];
    }[] = [];

    items.push({ type: "cadastrado", date: job.created_at });

    if (sentVersions.length > 0) {
      sentVersions.forEach(sv => {
        items.push({
          type: "enviado",
          date: sv.sentAt,
          versionNumber: sv.versionNumber,
          sentCreativeIndices: sv.creativeIndices,
        });
      });
    } else if ((job as any).sent_for_approval_at) {
      items.push({ type: "enviado", date: (job as any).sent_for_approval_at });
    }

    const sortedFeedback = [...clientFeedback].sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );
    sortedFeedback.forEach((fb, idx) => {
      const isAdjust = fb.approval_status === "em_ajustes";
      const fbVersionNum = fb.version_number || (idx + 1);
      items.push({
        type: isAdjust ? "ajuste" : "aprovado",
        date: fb.submitted_at,
        feedback: fb,
        versionNumber: fbVersionNum,
      });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [job, clientFeedback, sentVersions]);

  // ── Version Detail View ──
  if (selectedVersion) {
    return (
      <VersionDetailView
        version={selectedVersion}
        onBack={() => setSelectedVersion(null)}
        initialCreativeIndex={initialCreativeIdx}
        job={job}
      />
    );
  }

  // ── Timeline View ──
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-1">
      <h3 className="font-semibold text-sm mb-4">Histórico</h3>

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-0">
          {events.map((evt, i) => {
            const config = EVENT_CONFIG[evt.type] || EVENT_CONFIG.cadastrado;
            const isAdjust = evt.type === "ajuste";
            const isVideoJob = job.material_type === "videos";

            // Find matching version for per-creative data
            const matchingVersion = evt.versionNumber
              ? versions.find((v) => v.version_number === evt.versionNumber)
              : null;
            const perCreative = matchingVersion?.feedback?.per_creative || evt.feedback?.per_creative;
            const hasPerCreative = perCreative && perCreative.length > 1;

            return (
              <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
                {/* Dot */}
                <div
                  className={`relative z-10 flex items-center justify-center h-[30px] w-[30px] rounded-full shrink-0 ${config.color}`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatDate(evt.date)}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-semibold ${config.borderColor} ${
                        isAdjust ? "bg-red-500/10 text-red-500" : ""
                      }`}
                    >
                      {config.label}
                    </Badge>
                    {evt.versionNumber && (evt.type === "aprovado" || evt.type === "ajuste") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-[10px] font-semibold gap-1 border-primary/40 text-primary hover:bg-primary/10"
                        onClick={() => {
                          const v = versions.find((ver) => ver.version_number === evt.versionNumber);
                          if (v) {
                            setInitialCreativeIdx(0);
                            setSelectedVersion(v);
                          }
                        }}
                      >
                        <Clock className="h-3 w-3" />
                        Versão {evt.versionNumber}
                      </Button>
                    )}
                  </div>

                  {/* Sent version details: which creatives were included */}
                  {evt.type === "enviado" && evt.sentCreativeIndices && evt.sentCreativeIndices.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {isVideoJob ? "Vídeos" : "Criativos"} enviados: {evt.sentCreativeIndices.map(i => `${isVideoJob ? "Vídeo" : "Criativo"} ${i + 1}`).join(", ")}
                    </p>
                  )}

                  {/* Feedback block */}
                  {evt.feedback && (
                    <Card className={`mt-2 ${isAdjust ? "border-red-500/30" : "border-border/30"}`}>
                      <CardContent className="p-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground">
                          {evt.feedback.client_name}
                        </p>

                        {/* Per-creative summary */}
                        {hasPerCreative ? (
                          <div className="space-y-0.5 border border-border/30 rounded-md overflow-hidden">
                            {perCreative.map((pc: any, pcIdx: number) => (
                              <CreativeSummaryRow
                                key={pcIdx}
                                itemLabel={isVideoJob ? `Vídeo ${(pc.creative_index ?? pcIdx) + 1}` : undefined}
                                eval={{
                                  creative_index: pc.creative_index ?? pcIdx,
                                  copy_rating: pc.copy_rating || 0,
                                  copy_comment: pc.copy_comment || "",
                                  design_rating: pc.design_rating || 0,
                                  design_comment: pc.design_comment || "",
                                  decision: pc.decision || pc.status || "em_ajustes",
                                  decided_at: pc.decided_at || evt.date,
                                }}
                                onViewClick={() => {
                                  const v = versions.find((ver) => ver.version_number === evt.versionNumber);
                                  if (v) {
                                    setInitialCreativeIdx(pc.creative_index ?? pcIdx);
                                    setSelectedVersion(v);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          // Single creative feedback (legacy)
                          <div className="space-y-1.5">
                            {evt.feedback.copy_rating > 0 && (
                              <StarRow rating={evt.feedback.copy_rating} label="Copy" />
                            )}
                            {evt.feedback.copy_comment && (
                              <div className={`rounded px-2.5 py-1.5 text-xs italic ${
                                isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/40 text-muted-foreground"
                              }`}>
                                "{evt.feedback.copy_comment}"
                              </div>
                            )}
                            {evt.feedback.design_rating > 0 && (
                              <StarRow rating={evt.feedback.design_rating} label="Design" />
                            )}
                            {evt.feedback.design_comment && (
                              <div className={`rounded px-2.5 py-1.5 text-xs italic ${
                                isAdjust ? "bg-red-500/5 text-red-400 border border-red-500/20" : "bg-muted/40 text-muted-foreground"
                              }`}>
                                "{evt.feedback.design_comment}"
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
      )}
    </div>
  );
}
