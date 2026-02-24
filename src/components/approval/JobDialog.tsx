import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/external-client";
import { toPersistentUrl } from "@/utils/fileToDataUrl";
import { Upload, X, ArrowLeft, History, Link2, Pencil, Star, Trash2, Plus, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { type ApprovalJobData as ApprovalJob, createJob, updateJob, getClientFeedback, getCreativeStates, initCreativeStates, createSentVersion, getSentVersions, type ApprovalClientFeedback, type MaterialCreativeState } from "@/services/approvalDataService";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { HistoryTimeline } from "./HistoryTimeline";

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ApprovalJob;
  onSave?: () => void;
  onClose?: () => void;
}

const MATERIAL_TYPES = [
  { value: "estaticos", label: "Estáticos" },
  { value: "videos", label: "Vídeos" },
  { value: "carrossel", label: "Carrossel" },
  { value: "landing_page", label: "Landing Page" },
] as const;

type MaterialType = typeof MATERIAL_TYPES[number]["value"];

// Clientes conforme base atualizada
const MOCK_CLIENTS = [
  "8 milímetros", "Ackno", "Amantícia", "Amazônia Madeiras", "Aquiraz Investimentos",
  "Baterias Pontocom", "BOX Car Brasil", "CA Inglês", "Café da Fazenda", "Central de Espelhos",
  "Centrominas Irrigações", "ClorUp", "Comece hub", "Connect Tecnologia", "Construlima",
  "Cotafácil", "Explorer Call Center", "Face Doctor", "Grupo Gemba", "Heropack",
  "Huli", "IGet Easy Market", "INFOCUS CX", "Inshape", "Isocompositos",
  "Itiban", "JB Log Saúde", "LB3", "Lebes", "Legal Search",
  "Linx", "Mantas Brasil", "NEO", "Norte Gás", "Oslo Group",
  "Paragon", "Paragon Bank", "Preditiva", "PluggTo", "Rede Conecta",
  "Rodomavi", "Sete Vidas", "Sonora", "Style Brazil", "Sul Solar",
  "Thiber", "Versátil Banheiras", "VisualFarm", "Vital Help", "Viva Natural",
];

// Designer & Copywriter lists now come from user registry
import { getActiveDesigners, getActiveCopywriters, getUserSquadByName } from "@/utils/getActiveUsers";

export function JobDialog({ open, onOpenChange, job, onSave, onClose }: JobDialogProps) {
  const LOCKED_STATUSES = ["para_aprovacao", "em_ajustes", "aprovado", "arquivado"];
  const isReadOnly = !!job && LOCKED_STATUSES.includes(job.status);
  const [isEditing, setIsEditing] = useState(false);
  const readOnly = isReadOnly && !isEditing;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientName, setClientName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType | "">("");
  const [designer, setDesigner] = useState("");
  const [copywriter, setCopywriter] = useState("");
  const [squad, setSquad] = useState("");
  const [squadSource, setSquadSource] = useState<"auto" | "manual">("auto");
  const [caption, setCaption] = useState("");
  const [landingPageLink, setLandingPageLink] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeClients, setActiveClients] = useState<string[]>([]);
  const [clientFeedback, setClientFeedback] = useState<any[]>([]);
  const [step1Errors, setStep1Errors] = useState<Record<string, boolean>>({});
  const [staticCreativeCount, setStaticCreativeCount] = useState<number>(1);
  // Per-creative files: supports File (new upload) or { url, name } (persisted)
  type StaticFileEntry = File | { url: string; name: string } | null;
  const [staticFiles, setStaticFiles] = useState<Record<number, { feed: StaticFileEntry; story: StaticFileEntry }>>({});
  // Per-creative captions for static materials
  const [staticCaptions, setStaticCaptions] = useState<Record<number, string>>({});
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

  // ── Video material state ──
  type VideoFileEntry = File | { url: string; name: string } | null;
  const [videoCount, setVideoCount] = useState<number>(1);
  const [videoFiles, setVideoFiles] = useState<Record<number, VideoFileEntry>>({});
  const [videoCaptions, setVideoCaptions] = useState<Record<number, string>>({});
  const [videoNotes, setVideoNotes] = useState<Record<number, string>>({});
  const [confirmRemoveVideoIdx, setConfirmRemoveVideoIdx] = useState<number | null>(null);

  const { toast } = useToast();

  const isCaptionRequired = materialType === "estaticos" || materialType === "carrossel" || materialType === "videos";
  const showLandingPageLink = materialType === "landing_page";

  // Creative states for partial approval tracking
  const [creativeStates, setCreativeStates] = useState<MaterialCreativeState[]>([]);
  useEffect(() => {
    if (!job?.id) { setCreativeStates([]); return; }
    getCreativeStates(job.id).then(setCreativeStates);
  }, [job?.id, open]);

  const isCreativeLocked = (idx: number): boolean => {
    const state = creativeStates.find(s => s.creativeIndex === idx);
    return state?.finalDecision === "APPROVED" && state?.locked === true;
  };

  const getCreativeApprovedVersion = (idx: number): number | undefined => {
    const state = creativeStates.find(s => s.creativeIndex === idx);
    return state?.approvedAtVersion;
  };

  // Version 1 ratings (primary/official ratings)
  const [v1Ratings, setV1Ratings] = useState<{ copy: number; design: number } | null>(null);
  useEffect(() => {
    if (!job?.id) { setV1Ratings(null); return; }
    getClientFeedback(job.id).then(feedbacks => {
      if (!feedbacks.length) { setV1Ratings(null); return; }
      const sorted = [...feedbacks].sort((a, b) => (a.version_number || 1) - (b.version_number || 1));
      const v1 = sorted[0];
      if (!v1.copy_rating && !v1.design_rating) { setV1Ratings(null); return; }
      setV1Ratings({ copy: v1.copy_rating, design: v1.design_rating });
    });
  }, [job?.id]);

  const acceptedFileTypes = useMemo(() => {
    switch (materialType) {
      case "videos":
        return ".png,.jpg,.jpeg,.mp4,.mov,.avi,image/png,image/jpeg,video/mp4,video/quicktime,video/x-msvideo";
      case "landing_page":
        return ".png,.jpg,.jpeg,.pdf,.doc,.docx,image/png,image/jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      default:
        return ".png,.jpg,.jpeg,.doc,.docx,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  }, [materialType]);

  // Check if all required fields for "Enviar para aprovação" are filled
  // Only checks PENDING (non-locked) creatives
  const canSendForApproval = useMemo(() => {
    if (!clientName.trim() || !campaignName.trim() || !materialType) return false;
    if (isCaptionRequired && materialType !== "estaticos" && materialType !== "videos" && !caption.trim()) return false;
    if (showLandingPageLink && !landingPageLink.trim()) return false;
    if (materialType === "estaticos") {
      let hasPending = false;
      for (let i = 0; i < staticCreativeCount; i++) {
        if (isCreativeLocked(i)) continue;
        hasPending = true;
        const entry = staticFiles[i];
        if (!entry?.feed || !entry?.story) return false;
        if (!(staticCaptions[i] || "").trim()) return false;
      }
      if (!hasPending) return false;
    }
    if (materialType === "videos") {
      let hasPending = false;
      for (let i = 0; i < videoCount; i++) {
        if (isCreativeLocked(i)) continue;
        hasPending = true;
        if (!videoFiles[i]) return false;
        if (!(videoCaptions[i] || "").trim()) return false;
      }
      if (!hasPending) return false;
    }
    return true;
  }, [clientName, campaignName, materialType, isCaptionRequired, caption, showLandingPageLink, landingPageLink, staticCreativeCount, staticFiles, staticCaptions, videoCount, videoFiles, videoCaptions, creativeStates]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setCurrentUser(profile);
        if (profile && !job) {
          setSquad(profile.squad || "");
        }
      }
    }

    async function loadClientFeedback() {
      if (job?.id) {
        try {
          const feedbacks = await getClientFeedback(job.id);
          setClientFeedback(feedbacks.map(f => ({
            id: f.id,
            job_id: f.job_id,
            client_name: f.client_name,
            rating: Math.round((f.copy_rating + f.design_rating) / 2),
            copy_rating: f.copy_rating,
            design_rating: f.design_rating,
            comment: [f.copy_comment, f.design_comment].filter(Boolean).join(" | ") || null,
            copy_comment: f.copy_comment,
            design_comment: f.design_comment,
            approval_status: f.approval_status,
            submitted_at: f.submitted_at,
          })));
        } catch {
          setClientFeedback([]);
        }
      }
    }

    async function loadActiveClients() {
      try {
        const { data: pipeline } = await supabase
          .from('crm_pipelines')
          .select('id')
          .eq('name', 'Clientes ativos')
          .eq('is_active', true)
          .single();

        if (!pipeline) {
          setActiveClients(MOCK_CLIENTS);
          return;
        }

        const { data: cards } = await supabase
          .from('crm_cards')
          .select('company_name')
          .eq('pipeline_id', pipeline.id);

        if (!cards || cards.length === 0) {
          setActiveClients(MOCK_CLIENTS);
          return;
        }

        const { data: lostClients } = await supabase
          .from('crm_special_lists')
          .select('company_name')
          .eq('list_type', 'perdido');

        const lostClientNames = new Set(lostClients?.map(c => c.company_name) || []);
        const activeClientNames = (cards as any[])
          .map((c: any) => c.company_name)
          .filter((name: any): name is string => !!name && !lostClientNames.has(name));

        const uniqueClients = Array.from(new Set(activeClientNames)).sort();
        setActiveClients(uniqueClients.length > 0 ? uniqueClients : MOCK_CLIENTS);
      } catch (error) {
        console.error('Erro ao carregar clientes ativos:', error);
        setActiveClients(MOCK_CLIENTS);
      }
    }

    if (open) {
      loadUser();
      loadActiveClients();
      loadClientFeedback();
    }
  }, [open, job?.id]);

  // Fill fields when editing or reset on new
  useEffect(() => {
    if (job && open) {
      setStep(1);
      setIsEditing(false);
      setClientName(job.client_name || "");
      setCampaignName(job.title || "");
      setCreationDate((job as any).creation_date || job.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDescription((job as any).description || "");
      setMaterialType((job as any).material_type || "");
      setDesigner((job as any).designer_name || "");
      setCopywriter((job as any).copywriter_name || "");
      setSquad((job as any).squad || "");
      setSquadSource((job as any).squad_source || ((job as any).squad ? "manual" : "auto"));
      setCaption((job as any).caption || "");
      setLandingPageLink((job as any).landing_page_link || "");
      setExistingFiles((job as any).attached_files || []);
      setFiles([]);
      setStep1Errors({});
      // Restore static creative data
      const jobAny = job as any;
      if (jobAny.material_type === "estaticos") {
        setStaticCreativeCount(Math.min(jobAny.static_creative_count || 1, 5));
        setStaticCaptions(jobAny.static_captions || {});
        setStaticFiles(jobAny.static_files_data || {});
      } else {
        setStaticCreativeCount(1);
        setStaticFiles({});
        setStaticCaptions({});
      }
      // Restore video data
      if (jobAny.material_type === "videos") {
        setVideoCount(Math.min(jobAny.video_count || 1, 5));
        setVideoFiles(jobAny.video_files_data || {});
        setVideoCaptions(jobAny.video_captions || {});
        setVideoNotes(jobAny.video_notes || {});
      } else {
        setVideoCount(1);
        setVideoFiles({});
        setVideoCaptions({});
        setVideoNotes({});
      }
    } else if (!job && open) {
      setStep(1);
      setClientName("");
      setCampaignName("");
      setCreationDate(new Date().toISOString().split('T')[0]);
      setDescription("");
      setMaterialType("");
      setCaption("");
      setLandingPageLink("");
      setFiles([]);
      setExistingFiles([]);
      setStep1Errors({});
      setCreatedJobId(null);
      setStaticCreativeCount(1);
      setStaticFiles({});
      setStaticCaptions({});
      setVideoCount(1);
      setVideoFiles({});
      setVideoCaptions({});
      setVideoNotes({});
    }
  }, [job, open]);

  // Resolve preview URLs for existing image files
  useEffect(() => {
    async function resolveExistingFileUrls() {
      if (!open || existingFiles.length === 0) return;
      const needResolve = existingFiles.some((f: any) => f && !f.url && f.type?.startsWith('image/'));
      if (!needResolve) return;

      try {
        const { data: allFiles, error: listError } = await supabase.storage
          .from('approval-attachments')
          .list('');
        if (listError) return;

        const resolved = existingFiles.map((f: any) => {
          if (!f || f.url || !f.type?.startsWith('image/') || !f.name) return f;
          const foundFile = allFiles?.find(file => file.name.includes(f.name.split('.')[0]));
          if (foundFile) {
            const { data: pub } = supabase.storage.from('approval-attachments').getPublicUrl(foundFile.name);
            return { ...f, url: pub.publicUrl, path: foundFile.name };
          }
          return f;
        });
        setExistingFiles(resolved);
      } catch (err) {
        console.warn('Could not resolve existing file URLs', err);
      }
    }
    resolveExistingFileUrls();
  }, [open, job?.id, existingFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(existingFiles.filter((_: any, i: number) => i !== index));
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!clientName.trim()) errors.client = true;
    if (!campaignName.trim()) errors.campaignName = true;
    if (!materialType) errors.materialType = true;
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para continuar.",
        variant: "destructive",
      });
    }
  };

  async function doSave(status: string, { keepOpen }: { keepOpen?: boolean } = {}) {
    try {
      setLoading(true);

      // Helper to check if value is a native File
      const isFile = (f: any): f is File => f instanceof File;

      // Build static file metadata with persistent URLs
      const staticFilesMeta: any[] = [];
      if (materialType === "estaticos") {
        for (const [idx, entry] of Object.entries(staticFiles)) {
          if (entry.feed) {
            const url = await toPersistentUrl(entry.feed);
            staticFilesMeta.push({ name: `criativo-${Number(idx) + 1}-feed-${entry.feed.name}`, size: isFile(entry.feed) ? entry.feed.size : 0, type: isFile(entry.feed) ? entry.feed.type : 'image/png', url, slot: 'feed', creative: Number(idx) + 1 });
          }
          if (entry.story) {
            const url = await toPersistentUrl(entry.story);
            staticFilesMeta.push({ name: `criativo-${Number(idx) + 1}-story-${entry.story.name}`, size: isFile(entry.story) ? entry.story.size : 0, type: isFile(entry.story) ? entry.story.type : 'image/png', url, slot: 'story', creative: Number(idx) + 1 });
          }
        }
      }

      // Build video file metadata with persistent URLs
      const videoFilesMeta: any[] = [];
      if (materialType === "videos") {
        for (const [idx, file] of Object.entries(videoFiles)) {
          if (file) {
            const url = await toPersistentUrl(file);
            videoFilesMeta.push({ name: `video-${Number(idx) + 1}-${file.name}`, size: isFile(file) ? file.size : 0, type: isFile(file) ? file.type : 'video/mp4', url, slot: 'video', creative: Number(idx) + 1 });
          }
        }
      }

      // Persist static files as serializable data for localStorage
      const staticFilesData: Record<number, { feed: { url: string; name: string } | null; story: { url: string; name: string } | null }> = {};
      if (materialType === "estaticos") {
        for (const [idx, entry] of Object.entries(staticFiles)) {
          const feedUrl = entry.feed ? await toPersistentUrl(entry.feed) : null;
          const storyUrl = entry.story ? await toPersistentUrl(entry.story) : null;
          staticFilesData[Number(idx)] = {
            feed: entry.feed ? { url: feedUrl!, name: entry.feed.name } : null,
            story: entry.story ? { url: storyUrl!, name: entry.story.name } : null,
          };
        }
      }

      // Persist video files as serializable data
      const videoFilesData: Record<number, { url: string; name: string } | null> = {};
      if (materialType === "videos") {
        for (const [idx, file] of Object.entries(videoFiles)) {
          if (file) {
            const url = await toPersistentUrl(file);
            videoFilesData[Number(idx)] = { url, name: file.name };
          } else {
            videoFilesData[Number(idx)] = null;
          }
        }
      }

      // When saving static materials, remove old static creative files from existingFiles
      const filteredExistingFiles = (materialType === "estaticos" || materialType === "videos")
        ? existingFiles.filter((f: any) => !f.creative && !f.slot)
        : existingFiles;

      // Convert generic attached files to persistent URLs too
      const newFilesWithUrls: any[] = [];
      for (const f of files) {
        const url = await toPersistentUrl(f);
        newFilesWithUrls.push({ name: f.name, size: f.size, type: f.type, url });
      }

      const filesMeta = [
        ...filteredExistingFiles,
        ...newFilesWithUrls,
        ...staticFilesMeta,
        ...videoFilesMeta,
      ];

      const commonData: Record<string, any> = {
        title: campaignName.trim(),
        client_name: clientName.trim(),
        creation_date: creationDate || new Date().toISOString().split('T')[0],
        description: description.trim() || null,
        attached_files: filesMeta,
        material_type: materialType || "imagem",
        responsible_name: [designer, copywriter].filter(Boolean).join(" / ") || currentUser?.name || "Admin DOT",
        designer_name: designer || null,
        copywriter_name: copywriter || null,
        squad: squad.trim() || null,
        squad_source: squadSource,
        caption: caption.trim() || null,
        landing_page_link: showLandingPageLink ? landingPageLink.trim() || null : null,
        static_creative_count: materialType === "estaticos" ? staticCreativeCount : null,
        static_captions: materialType === "estaticos" ? staticCaptions : null,
        static_files_data: materialType === "estaticos" ? staticFilesData : null,
        video_count: materialType === "videos" ? videoCount : null,
        video_captions: materialType === "videos" ? videoCaptions : null,
        video_notes: materialType === "videos" ? videoNotes : null,
        video_files_data: materialType === "videos" ? videoFilesData : null,
      };

      const targetJobId = job?.id || createdJobId;

      if (job) {
        await updateJob(job.id, { ...commonData, status } as any);
      } else if (createdJobId) {
        await updateJob(createdJobId, { ...commonData, status } as any);
      } else {
        const created = await createJob({
          ...commonData,
          status,
          responsible_user_id: currentUser?.user_id || "auth-mock-001",
        } as any);
        setCreatedJobId(created.id);
      }

      const resolvedJobId = job?.id || createdJobId || targetJobId;

      // When sending for approval, init creative states and create sent version
      if (status === "para_aprovacao" && resolvedJobId) {
        if (materialType === "estaticos") {
          await initCreativeStates(resolvedJobId, staticCreativeCount);
          const sentVersion = await createSentVersion(resolvedJobId);
          await updateJob(resolvedJobId, { pending_creative_indices: sentVersion.creativeIndices, current_version_number: sentVersion.versionNumber } as any);
        } else if (materialType === "videos") {
          await initCreativeStates(resolvedJobId, videoCount);
          const sentVersion = await createSentVersion(resolvedJobId);
          await updateJob(resolvedJobId, { pending_creative_indices: sentVersion.creativeIndices, current_version_number: sentVersion.versionNumber } as any);
        }
      }

      toast({
        title: status === "para_aprovacao" ? "Material enviado" : "Informações salvas",
        description: status === "para_aprovacao"
          ? "O material foi enviado para aprovação."
          : "As informações foram salvas com sucesso.",
      });

      if (status === "para_aprovacao" && !keepOpen) {
        setStep(1); setClientName(""); setCampaignName(""); setCreationDate(new Date().toISOString().split('T')[0]);
        setDescription(""); setMaterialType(""); setCaption(""); setLandingPageLink("");
        setFiles([]); setExistingFiles([]); setDesigner(""); setCopywriter(""); setSquad(""); setSquadSource("auto"); setStep1Errors({}); setCreatedJobId(null); setStaticCaptions({});
        setVideoCount(1); setVideoFiles({}); setVideoCaptions({}); setVideoNotes({});
        if (onSave) onSave();
        onOpenChange(false);
        if (onClose) onClose();
      } else {
        if (onSave) onSave();
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast({ title: "Erro ao salvar material", description: "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // ── Step indicators ──
  const StepIndicator = () => (
    <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/20">
      {[
        { num: 1, label: "Informações" },
        { num: 2, label: "Conteúdo" },
        { num: 3, label: "Histórico", icon: <History className="w-3 h-3" /> },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          {i > 0 && <div className="w-6 h-px bg-border" />}
          <button
            type="button"
            onClick={() => {
              if (s.num === 1) setStep(1);
              else if (s.num === 2 && validateStep1()) setStep(2);
              else if (s.num === 3) setStep(3);
            }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              step === s.num
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.icon || (
              <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold border-current">
                {s.num}
              </span>
            )}
            {s.label}
          </button>
        </div>
      ))}
    </div>
  );

  // ── Step 1 ──
  const renderStep1 = () => (
    <div className="grid grid-cols-[280px,1fr] gap-4 p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client">Cliente *</Label>
          <Select value={clientName} onValueChange={(v) => { setClientName(v); setStep1Errors(prev => ({ ...prev, client: false })); }} disabled={readOnly}>
            <SelectTrigger id="client" className={step1Errors.client ? "border-destructive" : ""}>
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {activeClients.map((client) => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creationDate">Data de criação</Label>
          <Input id="creationDate" type="date" value={creationDate} readOnly className="bg-muted/50 cursor-default" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="copywriter">Copywriter</Label>
          <Select value={copywriter} onValueChange={(v) => {
            setCopywriter(v);
            if (squadSource === "auto") {
              const userSquad = getUserSquadByName(v);
              if (userSquad) setSquad(userSquad);
            }
          }} disabled={readOnly}>
            <SelectTrigger id="copywriter" className={readOnly ? "bg-muted/50 cursor-default" : ""}>
              <SelectValue placeholder="Selecione o copywriter..." />
            </SelectTrigger>
            <SelectContent>
              {getActiveCopywriters().map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="designer">Designer</Label>
          <Select value={designer} onValueChange={(v) => {
            setDesigner(v);
            if (squadSource === "auto" && !copywriter) {
              const userSquad = getUserSquadByName(v);
              if (userSquad) setSquad(userSquad);
            }
          }} disabled={readOnly}>
            <SelectTrigger id="designer" className={readOnly ? "bg-muted/50 cursor-default" : ""}>
              <SelectValue placeholder="Selecione o designer..." />
            </SelectTrigger>
            <SelectContent>
              {getActiveDesigners().map((d) => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="squad">Squad</Label>
          <Select value={squad} onValueChange={(v) => { setSquad(v); setSquadSource("manual"); }} disabled={readOnly}>
            <SelectTrigger id="squad">
              <SelectValue placeholder="Selecione a squad..." />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "Athena", label: "Athena", color: "text-blue-400" },
                { value: "Ártemis", label: "Ártemis", color: "text-emerald-400" },
                { value: "Ares", label: "Ares", color: "text-red-400" },
                { value: "Apollo", label: "Apollo", color: "text-amber-400" },
              ].map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className={`font-medium ${s.color}`}>{s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaignName">Campanha *</Label>
          <Input
            id="campaignName"
            value={campaignName}
            onChange={(e) => { setCampaignName(e.target.value); setStep1Errors(prev => ({ ...prev, campaignName: false })); }}
            placeholder="Digite o nome da campanha"
            className={step1Errors.campaignName ? "border-destructive" : readOnly ? "bg-muted/50 cursor-default" : ""}
            readOnly={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Digite a descrição" className={`min-h-[80px] resize-none ${readOnly ? "bg-muted/50 cursor-default" : ""}`} readOnly={readOnly} />
        </div>

        <div className="space-y-2">
          <Label>Tipo de material *</Label>
          <Select value={materialType} onValueChange={(v) => { setMaterialType(v as MaterialType); setStep1Errors(prev => ({ ...prev, materialType: false })); setStaticFiles({}); setVideoFiles({}); }} disabled={readOnly}>
            <SelectTrigger className={step1Errors.materialType ? "border-destructive" : ""}>
              <SelectValue placeholder="Selecione o tipo de material..." />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {materialType === "estaticos" && (
          <div className="space-y-2">
            <Label htmlFor="staticCount">Quantidade de criativos *</Label>
            <Select value={String(staticCreativeCount)} onValueChange={(v) => { setStaticCreativeCount(Number(v)); setStep1Errors(prev => ({ ...prev, staticCount: false })); }} disabled={readOnly}>
              <SelectTrigger id="staticCount" className={step1Errors.staticCount ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Informe quantos criativos estáticos serão enviados (cada criativo possui versão Feed e Story).</p>
          </div>
        )}

        {materialType === "videos" && (
          <div className="space-y-2">
            <Label htmlFor="videoCount">Quantidade de vídeos *</Label>
            <Select value={String(videoCount)} onValueChange={(v) => { setVideoCount(Number(v)); setStep1Errors(prev => ({ ...prev, videoCount: false })); }} disabled={readOnly}>
              <SelectTrigger id="videoCount" className={step1Errors.videoCount ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Informe quantos vídeos serão enviados (formato 9:16).</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Remove a static creative and shift data down ──
  const handleRemoveCreative = (removeIdx: number) => {
    const newFiles: typeof staticFiles = {};
    const newCaptions: typeof staticCaptions = {};
    let target = 0;
    for (let i = 0; i < staticCreativeCount; i++) {
      if (i === removeIdx) continue;
      if (staticFiles[i]) newFiles[target] = staticFiles[i];
      if (staticCaptions[i] !== undefined) newCaptions[target] = staticCaptions[i];
      target++;
    }
    setStaticFiles(newFiles);
    setStaticCaptions(newCaptions);
    setStaticCreativeCount(prev => prev - 1);
  };

  // ── Add a new static creative ──
  const handleAddCreative = () => {
    setStaticCreativeCount(prev => prev + 1);
  };

  // ── Remove a video and shift data down ──
  const handleRemoveVideo = (removeIdx: number) => {
    const newFiles: typeof videoFiles = {};
    const newCaptions: typeof videoCaptions = {};
    const newNotes: typeof videoNotes = {};
    let target = 0;
    for (let i = 0; i < videoCount; i++) {
      if (i === removeIdx) continue;
      if (videoFiles[i]) newFiles[target] = videoFiles[i];
      if (videoCaptions[i] !== undefined) newCaptions[target] = videoCaptions[i];
      if (videoNotes[i] !== undefined) newNotes[target] = videoNotes[i];
      target++;
    }
    setVideoFiles(newFiles);
    setVideoCaptions(newCaptions);
    setVideoNotes(newNotes);
    setVideoCount(prev => prev - 1);
  };

  // ── Add a new video ──
  const handleAddVideo = () => {
    setVideoCount(prev => prev + 1);
  };

  // ── Static creative upload block ──
  const renderStaticCreativeUpload = (creativeIndex: number) => {
    const locked = isCreativeLocked(creativeIndex);
    const approvedVersion = getCreativeApprovedVersion(creativeIndex);
    const entry = staticFiles[creativeIndex] || { feed: null, story: null };
    const handleStaticFile = (slot: 'feed' | 'story', file: File | null) => {
      if (locked) return;
      setStaticFiles(prev => ({
        ...prev,
        [creativeIndex]: { ...(prev[creativeIndex] || { feed: null, story: null }), [slot]: file },
      }));
    };

    const isDisabled = readOnly || locked;

    const renderSlot = (slot: 'feed' | 'story', label: string) => {
      const file = entry[slot];
      const inputId = `static-${creativeIndex}-${slot}`;
      return (
        <div className="space-y-2 flex-1">
          <Label className="text-xs font-medium">{label}</Label>
          {file ? (
            <div className={`relative border rounded-lg overflow-hidden ${locked ? "bg-muted/50 opacity-75" : "bg-muted/30"}`}>
              <img src={file instanceof File ? URL.createObjectURL(file) : file.url} alt={`${label} preview`} className="w-full h-40 object-contain" />
              {!isDisabled && (
                <Button type="button" variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 text-destructive hover:text-destructive" onClick={() => handleStaticFile(slot, null)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground truncate px-2 py-1">{file.name}</p>
            </div>
          ) : !isDisabled ? (
            <div className="border-2 border-dashed rounded-lg text-center hover:border-primary/50 transition-colors p-4">
              <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={(e) => { if (e.target.files?.[0]) handleStaticFile(slot, e.target.files[0]); e.target.value = ''; }} className="hidden" id={inputId} />
              <label htmlFor={inputId} className="cursor-pointer">
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground">Upload {label}</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center text-xs text-muted-foreground">Sem arquivo</div>
          )}
        </div>
      );
    };

    return (
      <Card key={creativeIndex} className={`border-border/60 ${locked ? "border-emerald-500/30 bg-emerald-500/5" : ""} relative`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Criativo {creativeIndex + 1}</h4>
            {locked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold">
                ✓ APROVADO{approvedVersion ? ` na Versão ${approvedVersion}` : ""}
              </Badge>
            )}
            {!locked && !readOnly && staticCreativeCount > 1 && (
              confirmRemoveIdx === creativeIndex ? (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Remover?</span>
                  <Button type="button" variant="destructive" size="sm" className="h-6 px-2 text-xs" onClick={() => { handleRemoveCreative(creativeIndex); setConfirmRemoveIdx(null); }}>Sim</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setConfirmRemoveIdx(null)}>Não</Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setConfirmRemoveIdx(creativeIndex)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {renderSlot('feed', 'Versão Feed')}
            {renderSlot('story', 'Versão Story')}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Legenda do Criativo {creativeIndex + 1} {locked ? "" : "*"}</Label>
            <Textarea
              value={staticCaptions[creativeIndex] || ""}
              onChange={(e) => { if (!locked) setStaticCaptions(prev => ({ ...prev, [creativeIndex]: e.target.value })); }}
              placeholder={locked ? "Aprovado" : `Digite aqui a legenda do Criativo ${creativeIndex + 1}…`}
              rows={3}
              disabled={isDisabled}
              className={`resize-none ${locked ? "bg-muted/50 cursor-default" : ""}`}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Video upload block ──
  const renderVideoUpload = (videoIndex: number) => {
    const locked = isCreativeLocked(videoIndex);
    const approvedVersion = getCreativeApprovedVersion(videoIndex);
    const file = videoFiles[videoIndex] || null;
    const isDisabled = readOnly || locked;

    const handleVideoFile = (f: File | null) => {
      if (locked) return;
      setVideoFiles(prev => ({ ...prev, [videoIndex]: f }));
    };

    const fileUrl = file ? (file instanceof File ? URL.createObjectURL(file) : (file as any).url) : null;
    const isVideoFile = file ? (file instanceof File ? file.type.startsWith('video/') : (file as any).name?.match(/\.(mp4|mov|avi|webm)$/i)) : false;

    return (
      <Card key={videoIndex} className={`border-border/60 ${locked ? "border-emerald-500/30 bg-emerald-500/5" : ""} relative`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Vídeo {videoIndex + 1}</h4>
            {locked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold">
                ✓ APROVADO{approvedVersion ? ` na Versão ${approvedVersion}` : ""}
              </Badge>
            )}
            {!locked && !readOnly && videoCount > 1 && (
              confirmRemoveVideoIdx === videoIndex ? (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Remover?</span>
                  <Button type="button" variant="destructive" size="sm" className="h-6 px-2 text-xs" onClick={() => { handleRemoveVideo(videoIndex); setConfirmRemoveVideoIdx(null); }}>Sim</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setConfirmRemoveVideoIdx(null)}>Não</Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setConfirmRemoveVideoIdx(videoIndex)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )
            )}
          </div>

          {/* Video upload / preview */}
          {file && fileUrl ? (
            <div className="flex justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/30" style={{ width: 220, aspectRatio: "9/16", background: "#0f172a" }}>
                {isVideoFile ? (
                  <VideoPreviewPlayer url={fileUrl} />
                ) : (
                  <img src={fileUrl} alt={`Vídeo ${videoIndex + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10" />
                {/* Header */}
                <div className="absolute top-3 inset-x-3 flex items-center gap-2 z-20">
                  <div className="w-7 h-7 rounded-full border-2 border-white/80 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{(clientName || "C").charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-white text-[11px] font-semibold drop-shadow-sm">{clientName || "Cliente"}</span>
                </div>
                {/* Footer */}
                <div className="absolute bottom-2 inset-x-2 z-20">
                  <div className="rounded-full border border-white/30 bg-black/20 backdrop-blur-sm px-3 py-1.5 flex items-center">
                    <span className="text-white/50 text-[10px]">Enviar mensagem</span>
                  </div>
                </div>
                {/* Remove button */}
                {!isDisabled && (
                  <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 bg-background/80 text-destructive hover:text-destructive z-30" onClick={() => handleVideoFile(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : !isDisabled ? (
            <div className="border-2 border-dashed rounded-lg text-center hover:border-primary/50 transition-colors p-6">
              <input
                type="file"
                accept=".mp4,.mov,.avi,.webm,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={(e) => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]); e.target.value = ''; }}
                className="hidden"
                id={`video-upload-${videoIndex}`}
              />
              <label htmlFor={`video-upload-${videoIndex}`} className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-primary" />
                  <p className="text-xs text-muted-foreground">Upload do Vídeo (9:16)</p>
                  <p className="text-[10px] text-muted-foreground/60">MP4, MOV, AVI, WebM</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center text-xs text-muted-foreground">Sem arquivo</div>
          )}

          {file && (
            <p className="text-[10px] text-muted-foreground truncate">{file.name}</p>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Legenda do Vídeo {videoIndex + 1} {locked ? "" : "*"}</Label>
            <Textarea
              value={videoCaptions[videoIndex] || ""}
              onChange={(e) => { if (!locked) setVideoCaptions(prev => ({ ...prev, [videoIndex]: e.target.value })); }}
              placeholder={locked ? "Aprovado" : `Digite aqui a legenda do Vídeo ${videoIndex + 1}…`}
              rows={3}
              disabled={isDisabled}
              className={`resize-none ${locked ? "bg-muted/50 cursor-default" : ""}`}
            />
          </div>

          {/* Internal notes */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Observações internas (opcional)</Label>
            <Textarea
              value={videoNotes[videoIndex] || ""}
              onChange={(e) => { if (!locked) setVideoNotes(prev => ({ ...prev, [videoIndex]: e.target.value })); }}
              placeholder="Observações internas sobre este vídeo…"
              rows={2}
              disabled={isDisabled}
              className={`resize-none text-xs ${locked ? "bg-muted/50 cursor-default" : ""}`}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Check if all static creatives have both feed and story
  const allStaticsFilled = useMemo(() => {
    if (materialType !== "estaticos") return true;
    for (let i = 0; i < staticCreativeCount; i++) {
      const entry = staticFiles[i];
      if (!entry?.feed || !entry?.story) return false;
    }
    return true;
  }, [materialType, staticCreativeCount, staticFiles]);

  // ── Step 2 ──
  const renderStep2 = () => {
    const materialLabel = MATERIAL_TYPES.find(t => t.value === materialType)?.label || materialType;

    // Static creatives mode
    if (materialType === "estaticos") {
      return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{materialLabel}</Badge>
            <span>—</span>
            <span>{clientName}</span>
            <Badge variant="secondary" className="ml-auto">{staticCreativeCount} criativo{staticCreativeCount > 1 ? 's' : ''}</Badge>
          </div>

          <div className="space-y-4">
            {Array.from({ length: staticCreativeCount }, (_, i) => renderStaticCreativeUpload(i))}
          </div>

          {!readOnly && (
            <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={handleAddCreative}>
              <Plus className="w-3.5 h-3.5" /> Adicionar criativo
            </Button>
          )}
        </div>
      );
    }

    // Video mode
    if (materialType === "videos") {
      return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{materialLabel}</Badge>
            <span>—</span>
            <span>{clientName}</span>
            <Badge variant="secondary" className="ml-auto">{videoCount} vídeo{videoCount > 1 ? 's' : ''}</Badge>
          </div>

          <div className="space-y-4">
            {Array.from({ length: videoCount }, (_, i) => renderVideoUpload(i))}
          </div>

          {!readOnly && (
            <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={handleAddVideo}>
              <Plus className="w-3.5 h-3.5" /> Adicionar vídeo
            </Button>
          )}
        </div>
      );
    }

    // Landing Page mode — reordered: Link → Upload → Contexto
    if (materialType === "landing_page") {
      return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{materialLabel}</Badge>
            <span>—</span>
            <span>{clientName}</span>
          </div>

          {/* 1) Link da Landing Page */}
          <div className="space-y-2">
            <Label htmlFor="lpLink">Link da Landing Page *</Label>
            <Input id="lpLink" value={landingPageLink} onChange={(e) => setLandingPageLink(e.target.value)} placeholder="https://..." readOnly={readOnly} className={readOnly ? "bg-muted/50 cursor-default" : ""} />
          </div>

          {/* 2) Upload de arquivos */}
          <div className="space-y-2">
            <Label>Arraste seus arquivos:</Label>
            {(() => {
              const imageFiles = [
                ...existingFiles.filter((f: any) => f?.type?.startsWith('image/')).map((f: any) => ({ url: f.url, name: f.name })),
                ...files.filter(f => f.type.startsWith('image/')).map(f => ({ url: URL.createObjectURL(f), name: f.name }))
              ];
              return imageFiles.length > 0 ? (
                <div className="flex flex-col items-center mb-4 gap-3">
                  <InstagramPostPreview images={imageFiles} description={caption || description} clientName={clientName || "Cliente"} />
                  {!readOnly && (
                    <div className="space-y-1 w-full max-w-md">
                      {existingFiles.map((f: any, idx: number) => f?.type?.startsWith('image/') ? (
                        <div key={`existing-img-${idx}`} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                          <span className="text-xs truncate flex-1">{f.name}</span>
                          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => removeExistingFile(idx)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {!readOnly && (
              <div className="border-2 border-dashed rounded-lg text-center hover:border-primary/50 transition-colors p-4">
                <input type="file" multiple accept={acceptedFileTypes} onChange={handleFileChange} className="hidden" id="file-upload-step2-lp" />
                <label htmlFor="file-upload-step2-lp" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 border-2 rounded-lg flex items-center justify-center border-primary/50 hover:bg-primary/5 transition-colors">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Adicionar arquivos</p>
                  </div>
                </label>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(index)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {existingFiles.filter((f: any) => !f?.type?.startsWith('image/')).length > 0 && (
              <div className="space-y-2 mt-2">
                <Label className="text-xs">Documentos anexados:</Label>
                {existingFiles.map((file: any, index: number) => !file?.type?.startsWith('image/') ? (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    {!readOnly && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => removeExistingFile(index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          {/* 3) Contexto do material */}
          <div className="space-y-2">
            <Label htmlFor="caption">Contexto do material</Label>
            <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descreva o contexto do material, objetivo, observações ou orientações para aprovação…" className={`min-h-[100px] resize-none ${readOnly ? "bg-muted/50 cursor-default" : ""}`} readOnly={readOnly} />
          </div>
        </div>
      );
    }

    // Default mode for other material types (Carrossel, etc.)
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{materialLabel}</Badge>
          <span>—</span>
          <span>{clientName}</span>
        </div>

        <div className="space-y-2">
          <Label>Arraste seus arquivos:</Label>
          {(() => {
            const imageFiles = [
              ...existingFiles.filter((f: any) => f?.type?.startsWith('image/')).map((f: any) => ({ url: f.url, name: f.name })),
              ...files.filter(f => f.type.startsWith('image/')).map(f => ({ url: URL.createObjectURL(f), name: f.name }))
            ];
            return imageFiles.length > 0 ? (
              <div className="flex flex-col items-center mb-4 gap-3">
                <InstagramPostPreview images={imageFiles} description={caption || description} clientName={clientName || "Cliente"} />
                {!readOnly && (
                  <div className="space-y-1 w-full max-w-md">
                    {existingFiles.map((f: any, idx: number) => f?.type?.startsWith('image/') ? (
                      <div key={`existing-img-${idx}`} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                        <span className="text-xs truncate flex-1">{f.name}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => removeExistingFile(idx)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            ) : null;
          })()}

          {!readOnly && (
            <div className="border-2 border-dashed rounded-lg text-center hover:border-primary/50 transition-colors p-4">
              <input type="file" multiple accept={acceptedFileTypes} onChange={handleFileChange} className="hidden" id="file-upload-step2" />
              <label htmlFor="file-upload-step2" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-10 h-10 border-2 rounded-lg flex items-center justify-center border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Adicionar arquivos</p>
                </div>
              </label>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-2 mt-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                  <span className="text-xs truncate flex-1">{file.name}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(index)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {existingFiles.filter((f: any) => !f?.type?.startsWith('image/')).length > 0 && (
            <div className="space-y-2 mt-2">
              <Label className="text-xs">Documentos anexados:</Label>
              {existingFiles.map((file: any, index: number) => !file?.type?.startsWith('image/') ? (
                <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                  <span className="text-xs truncate flex-1">{file.name}</span>
                  {!readOnly && (
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => removeExistingFile(index)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ) : null)}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Legenda / Texto do material {isCaptionRequired ? "*" : "(opcional)"}</Label>
          <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Digite a legenda ou texto do material" className={`min-h-[100px] resize-none ${readOnly ? "bg-muted/50 cursor-default" : ""}`} readOnly={readOnly} />
        </div>
      </div>
    );
  };

  // ── Step 3 — Histórico ──
  const renderStep3 = () => {
    if (!job) {
      return (
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          <h3 className="font-semibold text-sm">Histórico</h3>
          <div className="text-sm">
            <div className="text-primary font-medium">
              {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-muted-foreground">Será registrado ao salvar</div>
          </div>
        </div>
      );
    }
    return <HistoryTimeline job={job as any} clientFeedback={clientFeedback} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] overflow-hidden p-0 flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Aprovar Material</DialogTitle>
          </DialogHeader>

          <StepIndicator />

          {/* V1 Ratings block — read-only, shown only if ratings exist */}
          {v1Ratings && (
            <div className="px-6 py-3 border-b bg-muted/10">
              <Card className="border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-8">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Avaliação da Copy</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= v1Ratings.copy ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Nota registrada na 1ª versão</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Avaliação do Design</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= v1Ratings.design ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Nota registrada na 1ª versão</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <span className="text-xs font-medium">
                  {currentUser?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{currentUser?.name || 'Carregando...'}</span>
              <Badge variant="secondary">
                ETAPA {step}/3
              </Badge>
            </div>
            <div className="flex gap-2">
              {readOnly ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(true)} className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Editar informações
                  </Button>
                  {job?.status !== "em_ajustes" && (
                    <Button type="button" variant="outline" className="gap-1.5" onClick={() => {
                      const shareUrl = `${window.location.origin}/aprovacao-cliente/${job?.share_token}`;
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        toast({ title: "Link copiado!", description: "Link de aprovação copiado para a área de transferência." });
                      });
                    }}>
                      <Link2 className="w-3.5 h-3.5" /> Copiar link
                    </Button>
                  )}
                  {job?.status === "em_ajustes" && (
                    <Button type="button" onClick={() => doSave("para_aprovacao")} disabled={loading || !canSendForApproval}>
                      {loading ? "Enviando..." : "Reenviar para aprovação"}
                    </Button>
                  )}
                </>
              ) : isEditing && isReadOnly ? (
                <>
                  <Button type="button" variant="outline" onClick={() => { setIsEditing(false); }} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="secondary" onClick={async () => { await doSave(job?.status || "para_aprovacao", { keepOpen: true }); setIsEditing(false); }} disabled={loading} className="gap-1.5">
                    {loading ? "Salvando..." : "Salvar informações"}
                  </Button>
                  {job?.status === "em_ajustes" && (
                    <Button type="button" onClick={() => doSave("para_aprovacao")} disabled={loading || !canSendForApproval}>
                      {loading ? "Enviando..." : "Reenviar para aprovação"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep((step - 1) as 1 | 2)} disabled={loading}>
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  {step === 1 && (
                    <>
                      <Button type="button" variant="secondary" onClick={() => doSave("rascunho")} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar informações"}
                      </Button>
                      <Button type="button" onClick={handleContinue}>Continuar</Button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <Button type="button" variant="secondary" onClick={() => doSave("rascunho")} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar informações"}
                      </Button>
                      <Button type="button" onClick={() => doSave("para_aprovacao")} disabled={loading || !canSendForApproval}>
                        {loading ? "Enviando..." : "Enviar para aprovação"}
                      </Button>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <Button type="button" variant="secondary" onClick={() => doSave("rascunho")} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar informações"}
                      </Button>
                      <Button type="button" onClick={() => doSave("para_aprovacao")} disabled={loading || !canSendForApproval}>
                        {loading ? "Enviando..." : "Enviar para aprovação"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Inline Video Preview Player with play/pause ──
function VideoPreviewPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <>
      <video
        ref={videoRef}
        src={url}
        className="absolute inset-0 w-full h-full object-cover"
        onEnded={() => setPlaying(false)}
        playsInline
        muted
      />
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        {!playing && (
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        )}
      </button>
      {playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-10 right-2 z-20 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center"
        >
          <Pause className="w-3 h-3 text-white" fill="white" />
        </button>
      )}
    </>
  );
}
