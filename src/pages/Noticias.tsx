import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DotLogo } from "@/components/DotLogo";
import { motion } from "framer-motion";
import { fetchNews, type NewsItem } from "@/services/newsService";
import { NewsThumbnail } from "@/components/home/NewsThumbnail";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";

/* ── Category tokens ── */
const categoryColors: Record<string, string> = {
  Marketing: "bg-primary text-primary-foreground border-transparent",
  Ads: "bg-blue-600 text-white border-transparent",
  Negócios: "bg-emerald-600 text-white border-transparent",
  IA: "bg-violet-600 text-white border-transparent",
  SEO: "bg-amber-600 text-white border-transparent",
  Social: "bg-pink-600 text-white border-transparent",
  Vendas: "bg-orange-600 text-white border-transparent",
  Design: "bg-cyan-600 text-white border-transparent",
};

const categoryDots: Record<string, string> = {
  Marketing: "bg-primary",
  Ads: "bg-blue-500",
  Negócios: "bg-emerald-500",
  IA: "bg-violet-500",
  SEO: "bg-amber-500",
  Social: "bg-pink-500",
  Vendas: "bg-orange-500",
  Design: "bg-cyan-500",
};

const glassCard =
  "rounded-2xl border border-border/10 bg-card/[0.06] backdrop-blur-xl overflow-hidden transition-all duration-300";

/* ── Debounce ── */
function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ═══════════════════════════════════════════
   HERO CARD
   ═══════════════════════════════════════════ */
function HeroCard({ item, onImageGenerated }: { item: NewsItem; onImageGenerated: (id: string, url: string) => void }) {
  const badgeColor = categoryColors[item.category] || "";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`group relative flex flex-col ${glassCard} hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20`}
    >
      <NewsThumbnail item={item} className="w-full min-h-[280px] md:min-h-[320px]" onImageGenerated={onImageGenerated}>
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
        <Badge variant="outline" className={`absolute top-4 left-4 text-[11px] font-semibold backdrop-blur-md ${badgeColor}`}>
          {item.category}
        </Badge>
        <ExternalLink className="absolute top-4 right-4 h-4 w-4 text-foreground/30 group-hover:text-primary transition-colors" />
        <div className="absolute inset-x-0 bottom-0 p-6 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
            {item.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
            {item.excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pt-1">
            <span>{item.source}</span>
            <span>·</span>
            <span>{new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>
      </NewsThumbnail>
    </motion.a>
  );
}

/* ═══════════════════════════════════════════
   GRID CARD
   ═══════════════════════════════════════════ */
function GridCard({ item, index, onImageGenerated }: { item: NewsItem; index: number; onImageGenerated: (id: string, url: string) => void }) {
  const badgeColor = categoryColors[item.category] || "";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={`group relative flex flex-col ${glassCard} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20`}
    >
      <NewsThumbnail item={item} className="w-full h-40" onImageGenerated={onImageGenerated}>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <Badge variant="outline" className={`absolute top-3 left-3 text-[10px] font-semibold backdrop-blur-md ${badgeColor}`}>
          {item.category}
        </Badge>
        <ExternalLink className="absolute top-3 right-3 h-3.5 w-3.5 text-foreground/20 group-hover:text-primary transition-colors" />
      </NewsThumbnail>

      <div className="flex flex-col gap-1.5 p-4 pt-3">
        <h3 className="text-sm md:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground/60 leading-relaxed line-clamp-2">{item.excerpt}</p>
        <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground/50">
          <span>{item.source}</span>
          <span>{new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
        </div>
      </div>
    </motion.a>
  );
}

/* ═══════════════════════════════════════════
   LIST ROW
   ═══════════════════════════════════════════ */
function ListRow({ item, index, onImageGenerated }: { item: NewsItem; index: number; onImageGenerated: (id: string, url: string) => void }) {
  const dot = categoryDots[item.category] || "bg-primary";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`group flex items-start gap-4 p-4 ${glassCard} hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-px`}
    >
      <NewsThumbnail item={item} className="shrink-0 w-32 h-22 rounded-lg" onImageGenerated={onImageGenerated}>
        {item.image && <div className="absolute inset-0 bg-black/60" />}
      </NewsThumbnail>
      <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
        <h4 className="text-sm md:text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <p className="text-xs text-muted-foreground/60 leading-relaxed line-clamp-2">{item.excerpt}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
          <span>{item.source}</span>
          <span>·</span>
          <span>{new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
        </div>
      </div>
    </motion.a>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
export default function Noticias() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(18);
  const debouncedQuery = useDebounce(query, 300);

  const load = async () => {
    setLoading(true);
    const data = await fetchNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleImageGenerated = useCallback((id: string, url: string) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, image: url } : n));
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return news;
    const q = debouncedQuery.toLowerCase();
    return news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [news, debouncedQuery]);

  const isSearchActive = debouncedQuery.trim().length > 0;
  const visibleItems = !isSearchActive ? filtered.slice(0, visibleCount) : filtered;
  const topItems = !isSearchActive ? visibleItems.slice(0, 2) : [];
  const gridItems = !isSearchActive ? visibleItems.slice(2) : [];
  const searchItems = isSearchActive ? filtered : [];
  const hasMore = !isSearchActive && visibleCount < filtered.length;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar
          activeView={"" as any}
          onViewChange={(view: any) => {
            if (view === "aprovacao") navigate("/aprovacao");
            else navigate(`/dashboard?view=${view}`);
          }}
        />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">

              {/* ── Header ── */}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Notícias e Conteúdos</h1>
                  <p className="text-muted-foreground">Marketing, publicidade e negócios.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por palavra-chave…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 pr-9 h-9 text-sm bg-card/[0.06] backdrop-blur-lg border-border/10 rounded-xl"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={load}
                    disabled={loading}
                    className="gap-1.5 text-xs shrink-0 h-9 rounded-xl"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* ── Result counter ── */}
              {isSearchActive && !loading && (
                <p className="text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} encontrado{filtered.length !== 1 ? "s" : ""}
                </p>
              )}

              {/* ── Loading state ── */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <DotLogo size={48} animate />
                  <div className="w-48">
                    <Progress value={undefined} className="h-1.5 bg-muted/30" />
                  </div>
                  <p className="text-xs text-muted-foreground animate-pulse">Carregando notícias…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border/10 bg-card/[0.03] backdrop-blur-lg p-16 text-muted-foreground">
                  {isSearchActive ? (
                    <>
                      <p className="text-sm">Nenhum resultado para "<span className="text-foreground font-medium">{debouncedQuery}</span>"</p>
                      <Button variant="link" size="sm" onClick={() => setQuery("")} className="mt-2 text-xs">
                        Limpar busca
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm">Nenhuma notícia disponível.</p>
                  )}
                </div>
              ) : isSearchActive ? (
                <div className="flex flex-col gap-3">
                  {searchItems.map((item, i) => (
                    <ListRow key={item.id} item={item} index={i} onImageGenerated={handleImageGenerated} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {topItems.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {topItems.map((item) => (
                        <HeroCard key={item.id} item={item} onImageGenerated={handleImageGenerated} />
                      ))}
                    </div>
                  )}
                  {gridItems.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {gridItems.map((item, i) => (
                        <GridCard key={item.id} item={item} index={i} onImageGenerated={handleImageGenerated} />
                      ))}
                    </div>
                  )}
                  {hasMore && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleCount(prev => prev + 6)}
                        className="gap-1.5 text-xs h-9 rounded-xl border-border/20 bg-card/[0.06] backdrop-blur-lg hover:border-primary/30"
                      >
                        Ver mais notícias ({filtered.length - visibleCount} restantes)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
