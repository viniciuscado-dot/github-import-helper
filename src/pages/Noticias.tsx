import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Search, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { fetchNews, type NewsItem } from "@/services/newsService";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";

const categoryGradients: Record<string, string> = {
  Marketing: "from-primary/30 via-primary/10 to-primary/5",
  Ads: "from-blue-500/30 via-blue-500/10 to-blue-500/5",
  Negócios: "from-emerald-500/30 via-emerald-500/10 to-emerald-500/5",
};

const categoryColors: Record<string, string> = {
  Marketing: "bg-primary/20 text-primary border-primary/30",
  Ads: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Negócios: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
};

const categoryDots: Record<string, string> = {
  Marketing: "bg-primary",
  Ads: "bg-blue-500",
  Negócios: "bg-emerald-500",
};

const glassCard =
  "rounded-2xl border border-border/10 bg-card/[0.06] backdrop-blur-xl overflow-hidden transition-all duration-300";

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ── Hero Card (large) ── */
function HeroCardLarge({ item }: { item: NewsItem }) {
  const gradient = categoryGradients[item.category] || categoryGradients.Marketing;
  const badgeColor = categoryColors[item.category] || "";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`group relative flex flex-col ${glassCard} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 row-span-2`}
    >
      <div className="relative w-full h-full min-h-[320px] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />

        <Badge variant="outline" className={`absolute top-4 left-4 text-[11px] font-semibold backdrop-blur-md ${badgeColor}`}>
          {item.category}
        </Badge>
        <ExternalLink className="absolute top-4 right-4 h-4 w-4 text-foreground/30 group-hover:text-primary transition-colors" />

        <div className="absolute inset-x-0 bottom-0 p-5 pb-4 space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
            {item.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.excerpt}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span>{item.source}</span>
            <span>·</span>
            <span>{new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

/* ── Hero Card (small — right side) ── */
function HeroCardSmall({ item, index }: { item: NewsItem; index: number }) {
  const gradient = categoryGradients[item.category] || categoryGradients.Marketing;
  const badgeColor = categoryColors[item.category] || "";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className={`group relative flex flex-col ${glassCard} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20`}
    >
      <div className="relative w-full h-full min-h-[154px] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />

        <Badge variant="outline" className={`absolute top-3 left-3 text-[10px] font-semibold backdrop-blur-md ${badgeColor}`}>
          {item.category}
        </Badge>

        <div className="absolute inset-x-0 bottom-0 p-4 pb-3 space-y-1">
          <h3 className="text-sm md:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground/60 line-clamp-1">{item.excerpt}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
            <span>{item.source}</span>
            <span>·</span>
            <span>{new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

/* ── List Item (below hero) ── */
function NewsListRow({ item, index }: { item: NewsItem; index: number }) {
  const gradient = categoryGradients[item.category] || categoryGradients.Marketing;
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
      {/* Thumbnail */}
      <div className={`shrink-0 w-36 h-24 rounded-lg bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="w-full h-full opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
        <h4 className="text-sm md:text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <p className="text-xs text-muted-foreground/60 leading-relaxed line-clamp-2">
          {item.excerpt}
        </p>
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

/* ── Page ── */
export default function Noticias() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const load = async () => {
    setLoading(true);
    const data = await fetchNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
  const heroItems = !isSearchActive && filtered.length >= 3 ? filtered.slice(0, 3) : [];
  const listItems = isSearchActive ? filtered : filtered.slice(heroItems.length > 0 ? 3 : 0);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar
          activeView="home-criacao"
          onViewChange={(view: any) => {
            if (view === "aprovacao") navigate("/aprovacao");
            else navigate(`/dashboard?view=${view}`);
          }}
        />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0" style={{ scrollbarGutter: "stable" }}>
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Top bar: back + search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8 shrink-0"
                    onClick={() => navigate("/dashboard?view=home-criacao")}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar
                  </Button>
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">Tendências e Notícias</h1>
                    <p className="text-xs text-muted-foreground">Marketing, publicidade e negócios.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por palavra-chave…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-8 pr-8 h-8 text-xs bg-card/[0.06] backdrop-blur-lg border-border/10 rounded-lg"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 text-xs shrink-0 h-8">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              {isSearchActive && !loading && (
                <p className="text-[10px] text-muted-foreground">
                  Exibindo {filtered.length} de {news.length}
                </p>
              )}

              {loading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                    <Skeleton className="h-[320px] rounded-2xl" />
                    <div className="flex flex-col gap-4">
                      <Skeleton className="h-[154px] rounded-2xl" />
                      <Skeleton className="h-[154px] rounded-2xl" />
                    </div>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[100px] rounded-2xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-border/10 bg-card/[0.03] backdrop-blur-lg p-10 text-muted-foreground">
                  {isSearchActive ? (
                    <>
                      <p className="text-sm">Nenhum resultado para "{debouncedQuery}"</p>
                      <Button variant="link" size="sm" onClick={() => setQuery("")} className="mt-1 text-xs">
                        Limpar busca
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm">Nenhuma notícia disponível.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Hero grid — 1 large left + 2 small right */}
                  {heroItems.length === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                      <HeroCardLarge item={heroItems[0]} />
                      <div className="flex flex-col gap-4">
                        <HeroCardSmall item={heroItems[1]} index={1} />
                        <HeroCardSmall item={heroItems[2]} index={2} />
                      </div>
                    </div>
                  )}

                  {/* List items */}
                  {listItems.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {listItems.map((item, i) => (
                        <NewsListRow key={item.id} item={item} index={i} />
                      ))}
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
