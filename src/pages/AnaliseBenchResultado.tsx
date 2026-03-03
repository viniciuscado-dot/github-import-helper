import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, ArrowLeft, Copy, RefreshCw, Pencil, Save, X, Link,
  Building2, Globe, Target, TrendingUp, Users, FileText,
  Crosshair, BarChart3, Lightbulb, Rocket, Eye, ChevronRight,
  Layers, Shield, Zap
} from "lucide-react";
import { CopyGenerationOverlay } from "@/components/CopyGenerationOverlay";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";

/* ── Section parser ─────────────────────────────────────────── */

interface Section {
  id: string;
  title: string;
  content: string;
  icon: React.ElementType;
  level: number;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  objetivo: Crosshair,
  panorama: BarChart3,
  concorrent: Users,
  oportunidad: Lightbulb,
  recomenda: Rocket,
  estrateg: Target,
  mercado: TrendingUp,
  posicionamento: Layers,
  diferencia: Shield,
  ação: Zap,
  açõe: Zap,
  swot: BarChart3,
  resumo: FileText,
  conclus: FileText,
  analise: Eye,
  análise: Eye,
};

function pickIcon(title: string): React.ElementType {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return FileText;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function parseMarkdownSections(md: string): Section[] {
  if (!md) return [];
  const lines = md.split("\n");
  const sections: Section[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];
  let currentLevel = 2;

  const flush = () => {
    if (currentTitle) {
      sections.push({
        id: slugify(currentTitle),
        title: currentTitle.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim(),
        content: currentContent.join("\n").trim(),
        icon: pickIcon(currentTitle),
        level: currentLevel,
      });
    }
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      flush();
      currentLevel = match[1].length;
      currentTitle = match[2];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  flush();
  return sections;
}

/* ── Sticky TOC ─────────────────────────────────────────────── */

function TableOfContents({
  sections,
  activeId,
}: {
  sections: Section[];
  activeId: string;
}) {
  return (
    <nav className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3 px-2">
        Sumário
      </p>
      {sections.map((s) => {
        const isActive = activeId === s.id;
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => {
              const el = document.getElementById(`section-${s.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[13px] transition-all duration-150",
              s.level === 3 && "pl-6 text-[12px]",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{s.title}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Executive Card ─────────────────────────────────────────── */

function ExecutiveCard({
  section,
}: {
  section: Section;
}) {
  const Icon = section.icon;
  return (
    <div
      id={`section-${section.id}`}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm",
        "p-6 md:p-8 transition-all duration-200",
        "hover:border-border/60 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {section.title}
        </h2>
      </div>
      <Separator className="mb-5 opacity-40" />
      <div
        className={cn(
          "prose prose-sm md:prose-base max-w-none",
          "prose-headings:text-foreground prose-headings:font-semibold",
          "prose-p:text-muted-foreground prose-p:leading-relaxed",
          "prose-strong:text-foreground",
          "prose-li:text-muted-foreground prose-li:leading-relaxed",
          "prose-table:text-muted-foreground",
          "prose-th:text-foreground prose-th:font-semibold prose-th:border-border/30",
          "prose-td:border-border/20",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground",
          "prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md",
          "prose-hr:border-border/30"
        )}
      >
        <MarkdownRenderer content={section.content} />
      </div>
    </div>
  );
}

/* ── Info Pill ───────────────────────────────────────────────── */

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </span>
      </div>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

const STEP_MESSAGES = [
  "Lendo dados da campanha…",
  "Cruzando métricas de desempenho…",
  "Comparando benchmarks do setor…",
  "Identificando gargalos estratégicos…",
  "Mapeando oportunidades de crescimento…",
  "Gerando insights estratégicos…",
  "Finalizando análise…",
];

export default function AnaliseBenchResultado() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { checkModulePermission } = useModulePermissions();

  const canEdit = checkModulePermission("analise_bench", "edit");
  const canCreate = checkModulePermission("analise_bench", "create");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [overlayStatus, setOverlayStatus] = useState<"generating" | "success" | "error" | null>(null);
  const [overlayError, setOverlayError] = useState<string | undefined>();

  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: row, error } = await supabase
        .from("analise_bench_forms")
        .select("*, profiles:created_by(name, email)")
        .eq("id", id)
        .single();
      if (error || !row) {
        setNotFound(true);
      } else {
        setData(row);
      }
      setLoading(false);
    })();
  }, [id]);

  // Parse sections
  const sections = useMemo(() => parseMarkdownSections(data?.ai_response || ""), [data?.ai_response]);

  // Track active section on scroll
  useEffect(() => {
    if (sections.length === 0) return;
    setActiveSection(sections[0]?.id || "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace("section-", ""));
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const s of sections) {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  // Actions
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(data?.ai_response || "");
    toast.success("Análise copiada!");
  }, [data]);

  const handleShareLink = useCallback(() => {
    if (!data?.share_token) {
      toast.error("Token de compartilhamento não disponível");
      return;
    }
    const url = `${window.location.origin}/analise/${data.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }, [data]);

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("analise_bench_forms")
        .update({ ai_response: editedResponse })
        .eq("id", data.id);
      if (error) throw error;
      setData({ ...data, ai_response: editedResponse });
      setIsEditing(false);
      toast.success("Análise atualizada!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!data) return;
    setOverlayStatus("generating");
    setOverlayError(undefined);
    try {
      await supabase.from("analise_bench_forms").update({ status: "processing" }).eq("id", data.id);
      const { error } = await supabase.functions.invoke("generate-analise-bench", {
        body: { briefingId: data.id },
      });
      if (error) throw error;
      setOverlayStatus("success");
      await new Promise((r) => setTimeout(r, 1500));
      // Refetch
      const { data: updated } = await supabase
        .from("analise_bench_forms")
        .select("*, profiles:created_by(name, email)")
        .eq("id", data.id)
        .single();
      if (updated) setData(updated);
      setOverlayStatus(null);
    } catch (err: any) {
      setOverlayStatus("error");
      setOverlayError(err?.message || "Erro desconhecido");
      await supabase.from("analise_bench_forms").update({ status: "pending" }).eq("id", data.id);
    }
  };

  /* ── Loading / Not found ─────────────────────────────────── */

  if (loading) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
          <AppSidebar activeView="analise-bench" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
          <SidebarInset className="flex-1 min-h-0">
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (notFound || !data) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
          <AppSidebar activeView="analise-bench" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
          <SidebarInset className="flex-1 min-h-0">
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <h1 className="text-xl font-bold text-foreground">Análise não encontrada</h1>
              <Button variant="outline" onClick={() => navigate("/dashboard?view=analise-bench")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const competitors: any[] = data.competitors || [];

  const infoPills = [
    { icon: Building2, label: "Empresa", value: data.nome_empresa },
    { icon: Globe, label: "Site", value: data.site },
    { icon: Target, label: "Público-alvo", value: data.publico_alvo },
    { icon: TrendingUp, label: "Objetivo", value: data.objetivo_projeto },
  ].filter((p) => p.value);

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="analise-bench" onViewChange={(view) => navigate(`/dashboard?view=${view}`)} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0" style={{ scrollbarGutter: "stable" }}>
            <TopBar />
    <div className="space-y-0 px-4 md:px-6">
      {overlayStatus && (
        <CopyGenerationOverlay
          status={overlayStatus}
          title="Regenerando análise…"
          successMessage="Análise regenerada com sucesso"
          stepMessages={STEP_MESSAGES}
          errorMessage={overlayError}
          onRetry={() => {
            setOverlayStatus(null);
            handleRegenerate();
          }}
        />
      )}

      {/* ── Page header ─────────────────────────────────── */}
      <div className="border-b border-border/40 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => navigate("/dashboard?view=analise-bench")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {data.nome_empresa || "Análise de Benchmarking"}
              </h1>
              <p className="text-muted-foreground">
                {data.nicho_empresa && `${data.nicho_empresa} · `}
                {format(new Date(data.created_at), "dd MMM yyyy", { locale: ptBR })}
                {data.profiles?.name && ` · ${data.profiles.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  setEditedResponse(data.ai_response || "");
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
            {isEditing && (
              <>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareLink}>
              <Link className="h-3.5 w-3.5 mr-1" /> Link
            </Button>
            {canCreate && (
              <Button variant="outline" size="sm" onClick={handleRegenerate}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto py-8 px-2" ref={contentRef}>
        {/* Hero */}
        <div className="text-center mb-10">
          {data.client_logo_url && (
            <div className="flex justify-center mb-4">
              <img
                src={data.client_logo_url}
                alt="Logo"
                className="max-h-16 max-w-[160px] object-contain rounded-lg"
              />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Benchmark Competitivo Estratégico
          </h1>
          <p className="text-muted-foreground">
            {data.nome_empresa}
            {data.nicho_empresa && ` · ${data.nicho_empresa}`}
          </p>
          <Badge variant="outline" className="mt-3 text-xs">
            Gerado via {data.ai_provider || "IA"} em{" "}
            {data.response_generated_at
              ? format(new Date(data.response_generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : format(new Date(data.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Badge>
        </div>

        {/* Info pills */}
        {infoPills.length > 0 && (
          <div className={cn("grid gap-4 mb-8", infoPills.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
            {infoPills.map((p, i) => (
              <InfoPill key={i} {...p} />
            ))}
          </div>
        )}

        {/* Additional details */}
        {(data.servicos_produtos || data.diferenciais_competitivos || data.maior_desafio) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              { label: "Serviços/Produtos", value: data.servicos_produtos },
              { label: "Diferenciais Competitivos", value: data.diferenciais_competitivos },
              { label: "Maior Desafio", value: data.maior_desafio },
              { label: "Informações Adicionais", value: data.informacoes_adicionais },
            ]
              .filter((item) => item.value)
              .map((item, i) => (
                <div key={i} className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/40 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {item.label}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.value}</p>
                </div>
              ))}
          </div>
        )}

        {/* Competitors */}
        {competitors.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Concorrentes Analisados</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitors.map((comp: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/40 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {comp.nome || `Concorrente ${idx + 1}`}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        comp.tipo === "direto"
                          ? "border-primary/40 text-primary"
                          : "border-blue-500/40 text-blue-400"
                      )}
                    >
                      {comp.tipo === "direto" ? "Direto" : "Indireto"}
                    </Badge>
                  </div>
                  {comp.site && <p className="text-xs text-muted-foreground truncate">{comp.site}</p>}
                  {comp.porque_escolhido && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{comp.porque_escolhido}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-8 opacity-30" />

        {/* ── AI Analysis ──────────────────────────────────── */}
        {data.ai_response && !isEditing && (
          <div className="flex gap-8">
            {/* TOC sidebar */}
            {sections.length > 2 && (
              <aside className="hidden xl:block w-56 shrink-0">
                <div className="sticky top-28">
                  <TableOfContents sections={sections} activeId={activeSection} />
                </div>
              </aside>
            )}

            {/* Sections */}
            <div className="flex-1 min-w-0 space-y-6">
              {sections.length > 0 ? (
                sections.map((s) => <ExecutiveCard key={s.id} section={s} />)
              ) : (
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 md:p-8">
                  <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                    <MarkdownRenderer content={data.ai_response} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <Textarea
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
            className="min-h-[600px] font-mono text-sm bg-card/60 rounded-xl border border-border/40"
          />
        )}

        {/* Pending / Failed states */}
        {data.status === "pending" && !data.ai_response && (
          <div className="rounded-2xl bg-muted/30 p-10 text-center border border-border/30">
            <p className="text-muted-foreground mb-4">Esta análise ainda não foi gerada.</p>
            {canCreate && (
              <Button onClick={handleRegenerate}>
                <Rocket className="h-4 w-4 mr-2" /> Gerar Análise
              </Button>
            )}
          </div>
        )}
        {data.status === "failed" && !data.ai_response && (
          <div className="rounded-2xl bg-destructive/5 p-10 text-center border border-destructive/20">
            <p className="text-destructive mb-4">Houve um erro ao gerar esta análise.</p>
            {canCreate && (
              <Button variant="destructive" onClick={handleRegenerate}>
                <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
              </Button>
            )}
          </div>
        )}
      </div>
      </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
