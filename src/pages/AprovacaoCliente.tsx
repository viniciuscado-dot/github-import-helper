// v7.0 - Round-based approval with re-evaluation without re-rating
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { submitClientFeedback, initCreativeStates, getOfficialRatings, type OfficialRatings } from "@/services/approvalDataService";
import { InstagramPostPreview } from "@/components/approval/InstagramPostPreview";
import { InstagramStoryPreview } from "@/components/approval/InstagramStoryPreview";
import { VideoStoryPreview } from "@/components/approval/VideoStoryPreview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, AlertCircle, Pencil, ChevronLeft, ChevronRight, Film, ExternalLink, Copy, FileText, Download, ImageIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DotLogo } from "@/components/DotLogo";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function StarRating({ value, hovered, onChange, onHover, onLeave, disabled }: {
  value: number; hovered: number; onChange: (v: number) => void;
  onHover: (v: number) => void; onLeave: () => void; disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)} onMouseLeave={onLeave}
          className="transition-transform hover:scale-110" disabled={disabled}>
          <Star className={`h-8 w-8 ${star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function TextOnlyScore({ label, value }: { label: string; value: number }) {
  return (
    <p className="text-sm text-muted-foreground">
      Nota oficial ({label}): <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
    </p>
  );
}

interface CreativeEval {
  copyRating: number; copyHovered: number; copyComment: string;
  designRating: number; designHovered: number; designComment: string;
  status: "aprovado" | "revisao" | null;
}

export default function AprovacaoCliente() {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [overallStatus, setOverallStatus] = useState<"aprovado" | "revisao" | null>(null);

  // Legacy single-creative state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [clientName, setClientName] = useState("");

  // Per-creative state (used for both statics and videos)
  const [creativeEvals, setCreativeEvals] = useState<Record<number, CreativeEval>>({});
  const [currentCreativeIdx, setCurrentCreativeIdx] = useState(0);
  const [currentSlot, setCurrentSlot] = useState<"feed" | "story">("feed");

  const isStatic = job?.material_type === "estaticos";
  const isVideo = job?.material_type === "videos";
  const isLandingPage = job?.material_type === "landing_page";
  const staticCreativeCount = job?.static_creative_count || 1;
  const videoCreativeCount = job?.video_count || 1;
  const itemCount = isStatic ? staticCreativeCount : isVideo ? videoCreativeCount : 1;
  const staticCaptions: Record<number, string> = isStatic ? (job?.static_captions || {}) : isVideo ? (job?.video_captions || {}) : {};
  
  // Pending creative indices
  const pendingCreativeIndices: number[] = job?.pending_creative_indices || Array.from({ length: itemCount }, (_, i) => i);
  const creativeCount = (isStatic || isVideo) ? pendingCreativeIndices.length : 0;
  const usePerCreative = (isStatic && staticCreativeCount > 1) || isVideo;

  // Official ratings from first evaluation (for re-submissions)
  const officialRatings: OfficialRatings | null = job?.official_ratings || null;
  const currentVersionNumber = job?.current_version_number || 1;
  const isResubmission = currentVersionNumber >= 2 || !!officialRatings;

  // Helper: get official rating for a specific creative
  const getOfficialCreativeRating = (idx: number) => {
    if (!officialRatings?.perCreative) return null;
    return officialRatings.perCreative[idx] || null;
  };

  // Debug: data source info
  const debugMediaSource = isVideo ? "job.attached_files (type=video/*)" : isStatic ? "job.attached_files (type=image/*)" : "job.attached_files";

  const getEval = (idx: number): CreativeEval => creativeEvals[idx] || {
    copyRating: 0, copyHovered: 0, copyComment: "",
    designRating: 0, designHovered: 0, designComment: "",
    status: null,
  };

  const updateEval = (idx: number, updates: Partial<CreativeEval>) => {
    setCreativeEvals(prev => ({ ...prev, [idx]: { ...getEval(idx), ...updates } }));
  };

  useEffect(() => { loadJob(); }, [token]);

  async function loadJob() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_approval_job_public", { _token: token });
      if (error) throw error;
      if (!data || data.length === 0) setJob(null);
      else setJob(data[0]);
    } catch (error) {
      console.error("Error loading job:", error);
      toast({ title: "Erro", description: "Não foi possível carregar o material para aprovação.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const allCreativesEvaluated = useMemo(() => {
    if (!usePerCreative) return true;
    for (let i = 0; i < creativeCount; i++) {
      const actualIdx = pendingCreativeIndices[i];
      if (!creativeEvals[actualIdx]?.status) return false;
    }
    return true;
  }, [usePerCreative, creativeCount, creativeEvals, pendingCreativeIndices]);

  async function handleSubmitLegacy(status: "aprovado" | "revisao") {
    if (!isResubmission && !rating) {
      toast({ title: "Atenção", description: "Por favor, selecione uma avaliação de 1 a 5 estrelas.", variant: "destructive" });
      return;
    }
    if (!clientName.trim()) {
      toast({ title: "Atenção", description: "Por favor, informe seu nome.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const mappedStatus = status === "revisao" ? "em_ajustes" : "aprovado";
      const effectiveRating = rating || officialRatings?.copyRating || 0;
      submitClientFeedback({
        jobId: job.id,
        clientName: clientName.trim(),
        copyRating: effectiveRating,
        copyComment: comment.trim() || "",
        designRating: effectiveRating,
        designComment: "",
        status: mappedStatus,
      });
      setOverallStatus(status);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Erro", description: "Não foi possível enviar seu feedback. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitPerCreative() {
    if (!clientName.trim()) {
      toast({ title: "Atenção", description: "Por favor, informe seu nome.", variant: "destructive" });
      return;
    }
    if (!allCreativesEvaluated) {
      toast({ title: "Atenção", description: `Avalie todos os ${isVideo ? "vídeos" : "criativos"} antes de enviar.`, variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      initCreativeStates(job.id, job.static_creative_count || pendingCreativeIndices.length);

      const perCreative = pendingCreativeIndices.map((actualIdx) => {
        const ev = getEval(actualIdx);
        const officialCreative = getOfficialCreativeRating(actualIdx);
        const mappedStatus = ev.status === "revisao" ? "em_ajustes" : (ev.status || "aprovado");
        return {
          creative_index: actualIdx,
          copy_rating: ev.copyRating || officialCreative?.copyRating || 0,
          copy_comment: ev.copyComment,
          design_rating: ev.designRating || officialCreative?.designRating || 0,
          design_comment: ev.designComment,
          status: mappedStatus as "aprovado" | "em_ajustes",
        };
      });
      const hasAdjustment = perCreative.some(c => c.status === "em_ajustes");
      const finalStatus = hasAdjustment ? "em_ajustes" : "aprovado";
      const avgCopy = Math.round(perCreative.reduce((s, c) => s + c.copy_rating, 0) / perCreative.length) || officialRatings?.copyRating || 0;
      const avgDesign = Math.round(perCreative.reduce((s, c) => s + c.design_rating, 0) / perCreative.length) || officialRatings?.designRating || 0;

      submitClientFeedback({
        jobId: job.id,
        clientName: clientName.trim(),
        copyRating: avgCopy,
        copyComment: "",
        designRating: avgDesign,
        designComment: "",
        status: finalStatus,
        perCreative,
      });

      setOverallStatus(hasAdjustment ? "revisao" : "aprovado");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Erro", description: "Não foi possível enviar seu feedback. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando material...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Material não encontrado</CardTitle>
            <CardDescription>Este link pode estar inválido ou o material foi removido.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const imageFiles = (job.attached_files || [])
    .filter((f: any) => f?.type?.startsWith('image/'))
    .map((f: any) => ({ url: f.url, name: f.name, creative: f.creative, slot: f.slot }));

  const videoFiles = (job.attached_files || [])
    .filter((f: any) => f?.type?.startsWith('video/'))
    .map((f: any) => ({ url: f.url, name: f.name, creative: f.creative }));

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <div className="mb-8"><DotLogo size={60} /></div>
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {overallStatus === "aprovado" ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-amber-500" />
              )}
            </div>
            <CardTitle>Obrigado pelo seu feedback!</CardTitle>
            <CardDescription>
              {overallStatus === "aprovado" ? "Material aprovado com sucesso." : "Suas sugestões de revisão foram registradas."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Helper: get images for a specific creative (statics)
  const getCreativeImages = (idx: number) => imageFiles.filter((f: any) => f.creative === idx + 1);
  const getCreativeFeedImages = (idx: number) => getCreativeImages(idx).filter((f: any) => f.slot === 'feed');
  const getCreativeStoryImages = (idx: number) => getCreativeImages(idx).filter((f: any) => f.slot === 'story');

  // Helper: get video for a specific index
  const getVideoForIndex = (idx: number) => {
    const matches = videoFiles.filter((f: any) => f.creative === idx + 1);
    return matches.length > 0 ? matches[0] : null;
  };

  // ── Render current VIDEO ──
  const renderCurrentVideo = () => {
    const posIdx = currentCreativeIdx;
    const actualIdx = pendingCreativeIndices[posIdx];
    const ev = getEval(actualIdx);
    const video = getVideoForIndex(actualIdx);
    const videoCaption = staticCaptions[actualIdx] || "";

    return (
      <div className="space-y-5">
        {/* Video navigation header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" disabled={posIdx === 0}
            onClick={() => setCurrentCreativeIdx(posIdx - 1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Vídeo {String(actualIdx + 1).padStart(2, "0")}</h2>
            <p className="text-xs text-muted-foreground">Vídeo {posIdx + 1} de {creativeCount}</p>
          </div>
          <Button variant="ghost" size="icon" disabled={posIdx === creativeCount - 1}
            onClick={() => setCurrentCreativeIdx(posIdx + 1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Status badge */}
        {ev.status && (
          <div className="flex justify-center">
            <Badge variant={ev.status === "aprovado" ? "default" : "destructive"}
              className={ev.status === "aprovado" ? "bg-green-600" : ""}>
              {ev.status === "aprovado" ? "✓ Aprovado" : "⚠ Revisão solicitada"}
            </Badge>
          </div>
        )}

        {/* Video mockup 9:16 */}
        <div className="flex justify-center">
          {video ? (
            <VideoStoryPreview
              videoUrl={video.url}
              clientName={job.client_name || "Cliente"}
            />
          ) : (
            <div
              className="relative overflow-hidden rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-3"
              style={{ width: 270, aspectRatio: "9/16", background: "#0f172a" }}
            >
              <Film className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground/60 text-sm text-center px-4">Nenhum vídeo anexado</p>
            </div>
          )}
        </div>

        {/* Caption */}
        {videoCaption && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-1">Legenda — Vídeo {String(actualIdx + 1).padStart(2, "0")}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{videoCaption}</p>
            </CardContent>
          </Card>
        )}

        {/* Copy evaluation */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">{isResubmission ? "Feedback da Copy" : "Aprovação da Copy"}</p>
              {!isResubmission && (
                <p className="text-xs text-muted-foreground">Avalie a clareza, persuasão e alinhamento com o objetivo.</p>
              )}
            </div>
            {!isResubmission && (
              <StarRating value={ev.copyRating} hovered={ev.copyHovered}
                onChange={(v) => updateEval(actualIdx, { copyRating: v })}
                onHover={(v) => updateEval(actualIdx, { copyHovered: v })}
                onLeave={() => updateEval(actualIdx, { copyHovered: 0 })} disabled={submitting} />
            )}
            <Textarea value={ev.copyComment} onChange={(e) => updateEval(actualIdx, { copyComment: e.target.value })}
              placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre a copy..."} rows={3} disabled={submitting} className="resize-none" />
          </CardContent>
        </Card>

        {/* Design evaluation */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">{isResubmission ? "Feedback do Design" : "Aprovação do Design"}</p>
              {!isResubmission && (
                <p className="text-xs text-muted-foreground">Avalie cores, edição, legibilidade e impacto visual.</p>
              )}
            </div>
            {!isResubmission && (
              <StarRating value={ev.designRating} hovered={ev.designHovered}
                onChange={(v) => updateEval(actualIdx, { designRating: v })}
                onHover={(v) => updateEval(actualIdx, { designHovered: v })}
                onLeave={() => updateEval(actualIdx, { designHovered: 0 })} disabled={submitting} />
            )}
            <Textarea value={ev.designComment} onChange={(e) => updateEval(actualIdx, { designComment: e.target.value })}
              placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre o design/edição..."} rows={3} disabled={submitting} className="resize-none" />
          </CardContent>
        </Card>

        {/* Per-video approve / request revision */}
        <div className="flex gap-3 items-center">
          <Button size="sm" variant="outline" className="gap-1.5"
            onClick={() => window.history.back()}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline"
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              updateEval(actualIdx, { status: "revisao" });
              if (posIdx + 1 < creativeCount) setCurrentCreativeIdx(posIdx + 1);
            }} disabled={submitting}>
            <Pencil className="h-3.5 w-3.5" /> Solicitar revisão
          </Button>
          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              updateEval(actualIdx, { status: "aprovado" });
              if (posIdx + 1 < creativeCount) setCurrentCreativeIdx(posIdx + 1);
            }} disabled={submitting}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
          </Button>
        </div>

        {/* Dots navigation */}
        <div className="flex justify-center gap-2 pt-2">
          {pendingCreativeIndices.map((aIdx, i) => {
            const st = creativeEvals[aIdx]?.status;
            return (
              <button key={i} onClick={() => setCurrentCreativeIdx(i)}
                className={`w-3 h-3 rounded-full border transition-colors ${
                  i === posIdx ? "bg-primary border-primary" :
                  st === "aprovado" ? "bg-green-500 border-green-500" :
                  st === "revisao" ? "bg-destructive border-destructive" :
                  "bg-muted border-border"
                }`}
                title={`Vídeo ${aIdx + 1}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // ── Render current STATIC creative (unchanged logic) ──
  const renderCurrentCreative = () => {
    const posIdx = currentCreativeIdx;
    const actualIdx = pendingCreativeIndices[posIdx];
    const ev = getEval(actualIdx);
    const feedImages = getCreativeFeedImages(actualIdx);
    const storyImages = getCreativeStoryImages(actualIdx);
    const allImages = getCreativeImages(actualIdx);
    const creativeCaption = staticCaptions[actualIdx] || "";
    const hasFeed = feedImages.length > 0 || allImages.length > 0;
    const hasStory = storyImages.length > 0;

    return (
      <div className="space-y-5">
        {/* Creative navigation header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" disabled={posIdx === 0}
            onClick={() => { setCurrentCreativeIdx(posIdx - 1); setCurrentSlot("feed"); }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Criativo {String(actualIdx + 1).padStart(2, "0")}</h2>
            <p className="text-xs text-muted-foreground">Criativo {posIdx + 1} de {creativeCount}</p>
          </div>
          <Button variant="ghost" size="icon" disabled={posIdx === creativeCount - 1}
            onClick={() => { setCurrentCreativeIdx(posIdx + 1); setCurrentSlot("feed"); }}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Status badge */}
        {ev.status && (
          <div className="flex justify-center">
            <Badge variant={ev.status === "aprovado" ? "default" : "destructive"}
              className={ev.status === "aprovado" ? "bg-green-600" : ""}>
              {ev.status === "aprovado" ? "✓ Aprovado" : "⚠ Revisão solicitada"}
            </Badge>
          </div>
        )}

        {/* Feed / Story toggle */}
        <div className="flex justify-center">
          <ToggleGroup type="single" value={currentSlot}
            onValueChange={(v) => { if (v) setCurrentSlot(v as "feed" | "story"); }}
            className="bg-muted rounded-lg p-1">
            <ToggleGroupItem value="feed" className="px-5 py-1.5 text-sm rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Feed
            </ToggleGroupItem>
            <ToggleGroupItem value="story" className="px-5 py-1.5 text-sm rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Story
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Art display */}
        <div className="flex justify-center">
          {currentSlot === "feed" ? (
            hasFeed ? (
              <div className="w-full max-w-md">
                <InstagramPostPreview
                  images={feedImages.length > 0 ? feedImages : allImages}
                  description={creativeCaption}
                  clientName={job.client_name || "Cliente"}
                  compact
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm w-full max-w-md">
                Sem imagem Feed
              </div>
            )
          ) : (
            hasStory ? (
              <InstagramStoryPreview
                images={storyImages}
                clientName={job.client_name || "Cliente"}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm w-full max-w-md">
                Sem imagem Story
              </div>
            )
          )}
        </div>

        {/* Caption */}
        {creativeCaption && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-1">Legenda — Criativo {String(actualIdx + 1).padStart(2, "0")}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{creativeCaption}</p>
            </CardContent>
          </Card>
        )}

        {/* Copy evaluation */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">{isResubmission ? "Feedback da Copy" : "Aprovação da Copy"}</p>
              {!isResubmission && (
                <p className="text-xs text-muted-foreground">Avalie a clareza, persuasão e alinhamento com o objetivo.</p>
              )}
            </div>
            {!isResubmission && (
              <StarRating value={ev.copyRating} hovered={ev.copyHovered}
                onChange={(v) => updateEval(actualIdx, { copyRating: v })}
                onHover={(v) => updateEval(actualIdx, { copyHovered: v })}
                onLeave={() => updateEval(actualIdx, { copyHovered: 0 })} disabled={submitting} />
            )}
            <Textarea value={ev.copyComment} onChange={(e) => updateEval(actualIdx, { copyComment: e.target.value })}
              placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre a copy..."} rows={3} disabled={submitting} className="resize-none" />
          </CardContent>
        </Card>

        {/* Design evaluation */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">{isResubmission ? "Feedback do Design" : "Aprovação do Design"}</p>
              {!isResubmission && (
                <p className="text-xs text-muted-foreground">Avalie cores, layout, legibilidade e impacto visual.</p>
              )}
            </div>
            {!isResubmission && (
              <StarRating value={ev.designRating} hovered={ev.designHovered}
                onChange={(v) => updateEval(actualIdx, { designRating: v })}
                onHover={(v) => updateEval(actualIdx, { designHovered: v })}
                onLeave={() => updateEval(actualIdx, { designHovered: 0 })} disabled={submitting} />
            )}
            <Textarea value={ev.designComment} onChange={(e) => updateEval(actualIdx, { designComment: e.target.value })}
              placeholder={isResubmission ? "Novo feedback desta versão (opcional)" : "Feedback sobre o design..."} rows={3} disabled={submitting} className="resize-none" />
          </CardContent>
        </Card>

        {/* Per-creative approve / request revision */}
        <div className="flex gap-3 items-center">
          <Button size="sm" variant="outline" className="gap-1.5"
            onClick={() => window.history.back()}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline"
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              updateEval(actualIdx, { status: "revisao" });
              if (posIdx + 1 < creativeCount) {
                setCurrentCreativeIdx(posIdx + 1);
                setCurrentSlot("feed");
              }
            }} disabled={submitting}>
            <Pencil className="h-3.5 w-3.5" /> Solicitar revisão
          </Button>
          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              updateEval(actualIdx, { status: "aprovado" });
              if (posIdx + 1 < creativeCount) {
                setCurrentCreativeIdx(posIdx + 1);
                setCurrentSlot("feed");
              }
            }} disabled={submitting}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
          </Button>
        </div>

        {/* Dots navigation */}
        <div className="flex justify-center gap-2 pt-2">
          {pendingCreativeIndices.map((aIdx, i) => {
            const st = creativeEvals[aIdx]?.status;
            return (
              <button key={i} onClick={() => { setCurrentCreativeIdx(i); setCurrentSlot("feed"); }}
                className={`w-3 h-3 rounded-full border transition-colors ${
                  i === posIdx ? "bg-primary border-primary" :
                  st === "aprovado" ? "bg-green-500 border-green-500" :
                  st === "revisao" ? "bg-destructive border-destructive" :
                  "bg-muted border-border"
                }`}
                title={`Criativo ${aIdx + 1}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const itemLabel = isVideo ? "Vídeo" : "Criativo";

  // ── Landing Page helpers ──
  const lpFileUrl = useMemo(() => {
    const attached = job.attached_files || [];
    const lpFile = attached.find((f: any) => {
      const t = f?.type || "";
      return t.startsWith("image/") || t === "application/pdf" || t.startsWith("application/");
    });
    if (lpFile) return lpFile.url || lpFile.fileUrl || lpFile.src || lpFile.path || lpFile.downloadUrl;
    return job.lpArquivo?.url || job.landingPageArquivo?.url || job.arquivoLP?.url
      || job.pdfUrl || job.imageUrl || job.anexoUrl || null;
  }, [job]);

  const lpFileType = useMemo(() => {
    if (!lpFileUrl) return null;
    const attached = job.attached_files || [];
    const lpFile = attached.find((f: any) => (f?.url || f?.fileUrl || "") === lpFileUrl);
    if (lpFile?.type === "application/pdf") return "pdf";
    if (lpFile?.type?.startsWith("image/")) return "imagem";
    if (job.lpArquivo?.tipo) return job.lpArquivo.tipo;
    if (lpFileUrl.toLowerCase().endsWith(".pdf")) return "pdf";
    return "imagem";
  }, [lpFileUrl, job]);

  const lpLink = useMemo(() => {
    return job.lpLink || job.urlLP || job.linkLandingPage || job.link || job.landing_page_link || "";
  }, [job]);

  const lpFileName = useMemo(() => {
    if (!lpFileUrl) return "";
    const attached = job.attached_files || [];
    const lpFile = attached.find((f: any) => (f?.url || f?.fileUrl || "") === lpFileUrl);
    if (lpFile?.name) return lpFile.name;
    if (job.lpArquivo?.nome) return job.lpArquivo.nome;
    if (job.nomeArquivo) return job.nomeArquivo;
    try { return decodeURIComponent(lpFileUrl.split("/").pop()?.split("?")[0] || "arquivo"); } catch { return "arquivo"; }
  }, [lpFileUrl, job]);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mb-6 flex justify-center"><DotLogo size={48} /></div>

      <div className="max-w-7xl mx-auto">

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Aprovação de Material</CardTitle>
            <CardDescription>Cliente: {job.client_name || "Não informado"}</CardDescription>
            {job.approval_deadline && (
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Prazo para aprovação:</strong>{" "}
                {format(new Date(job.approval_deadline), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Client name input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">Seu nome *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite seu nome" className="w-full px-3 py-2 border rounded-md bg-background max-w-md" disabled={submitting} />
          </CardContent>
        </Card>

        {/* Per-creative / per-video flow */}
        {usePerCreative ? (
          <div className="space-y-6 max-w-lg mx-auto">
            {isVideo ? renderCurrentVideo() : renderCurrentCreative()}

            {/* Summary + submit */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Resumo da avaliação</p>
                <div className="flex flex-wrap gap-2">
                  {pendingCreativeIndices.map((aIdx, i) => {
                    const st = creativeEvals[aIdx]?.status;
                    return (
                      <Badge key={i} variant={st === "aprovado" ? "default" : st === "revisao" ? "destructive" : "secondary"}
                        className={st === "aprovado" ? "bg-green-600" : ""}>
                        {itemLabel} {aIdx + 1}: {st === "aprovado" ? "Aprovado" : st === "revisao" ? "Revisão" : "Pendente"}
                      </Badge>
                    );
                  })}
                </div>
                <Button onClick={handleSubmitPerCreative}
                  disabled={submitting || !allCreativesEvaluated || !clientName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {submitting ? "Enviando..." : "Enviar avaliação completa"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : isLandingPage ? (
          /* Landing Page flow */
          <div className="space-y-6 max-w-2xl mx-auto">
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

            {/* Arquivo anexado — box + download */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Arquivo anexado</h3>
                <div className="flex items-center gap-4">
                  {/* File info box */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 rounded-lg border border-border/40 bg-muted/30 p-3">
                    {lpFileUrl ? (
                      <>
                        {lpFileType === "pdf" ? (
                          <FileText className="h-8 w-8 text-primary shrink-0" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-primary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{lpFileName}</p>
                          <p className="text-xs text-muted-foreground">{lpFileType === "pdf" ? "PDF" : "Imagem"} — Arquivo pronto para download</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="h-8 w-8 text-muted-foreground/40 shrink-0" />
                        <p className="text-sm text-muted-foreground">Nenhum arquivo anexado</p>
                      </>
                    )}
                  </div>
                  {/* Download button */}
                  <Button size="sm" className="gap-1.5 shrink-0" disabled={!lpFileUrl} asChild={!!lpFileUrl}>
                    {lpFileUrl ? (
                      <a href={lpFileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Baixar arquivo
                      </a>
                    ) : (
                      <span><Download className="h-4 w-4" /> Baixar arquivo</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Sua Avaliação</CardTitle>
                <CardDescription>
                  {isResubmission ? "Deixe seu novo feedback para esta versão" : "Avalie a Landing Page e deixe seus comentários"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isResubmission && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Avaliação (obrigatório)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110" disabled={submitting}>
                          <Star className={`h-8 w-8 ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isResubmission ? "Novo feedback desta versão (opcional)" : "Comentários (opcional)"}
                  </label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder={isResubmission ? "Escreva seu novo feedback..." : "Deixe seus comentários, sugestões ou aprovação..."} rows={4} disabled={submitting} className="resize-none" />
                </div>
                <div className="flex gap-3 pt-2 items-center">
                  <Button variant="outline" className="gap-1.5"
                    onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <div className="flex-1" />
                  <Button onClick={() => handleSubmitLegacy("aprovado")}
                    disabled={submitting || (!isResubmission && !rating) || !clientName.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> {submitting ? "Enviando..." : "Aprovado"}
                  </Button>
                  <Button onClick={() => handleSubmitLegacy("revisao")}
                    disabled={submitting || (!isResubmission && !rating) || !clientName.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    <AlertCircle className="h-4 w-4 mr-2" /> {submitting ? "Enviando..." : "Revisão"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Legacy single-creative flow */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
            <div className="flex justify-center items-start">
              {imageFiles.length > 0 ? (
                <InstagramPostPreview images={imageFiles} description={job.description} clientName={job.client_name || "Cliente"} />
              ) : (
                <Card className="w-full">
                  <CardContent className="p-8 text-center text-muted-foreground">Nenhuma imagem anexada</CardContent>
                </Card>
              )}
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Sua Avaliação</CardTitle>
                <CardDescription>
                  {isResubmission ? "Deixe seu novo feedback para esta versão" : "Avalie o material e deixe seus comentários"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isResubmission && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Avaliação (obrigatório)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110" disabled={submitting}>
                          <Star className={`h-8 w-8 ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isResubmission ? "Novo feedback desta versão (opcional)" : "Comentários (opcional)"}
                  </label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder={isResubmission ? "Escreva seu novo feedback..." : "Deixe seus comentários, sugestões ou aprovação..."} rows={4} disabled={submitting} className="resize-none" />
                </div>
                <div className="flex gap-3 pt-2 items-center">
                  <Button variant="outline" className="gap-1.5"
                    onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <div className="flex-1" />
                  <Button onClick={() => handleSubmitLegacy("aprovado")}
                    disabled={submitting || (!isResubmission && !rating) || !clientName.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> {submitting ? "Enviando..." : "Aprovado"}
                  </Button>
                  <Button onClick={() => handleSubmitLegacy("revisao")}
                    disabled={submitting || (!isResubmission && !rating) || !clientName.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    <AlertCircle className="h-4 w-4 mr-2" /> {submitting ? "Enviando..." : "Revisão"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
