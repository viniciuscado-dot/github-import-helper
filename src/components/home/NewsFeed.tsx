import { useState, useEffect, useMemo } from "react";
import { ExternalLink, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNews, type NewsItem } from "@/services/newsService";

const categoryColors: Record<string, string> = {
  Marketing: "bg-primary/10 text-primary border-primary/20",
  Ads: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Negócios: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const glassSection =
  "rounded-2xl border border-border/10 bg-card/[0.04] backdrop-blur-xl shadow-sm";
const glassCard =
  "rounded-xl border border-border/10 bg-card/[0.06] backdrop-blur-lg transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5";

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function NewsFeed() {
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

  useEffect(() => {
    load();
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

  return (
    <section className={`w-full p-5 ${glassSection}`}>
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Tendências e Notícias</h2>
          <p className="text-xs text-muted-foreground">Marketing, publicidade e negócios.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
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

      {/* Result count when searching */}
      {debouncedQuery.trim() && !loading && (
        <p className="text-[10px] text-muted-foreground mb-2">
          Exibindo {filtered.length} de {news.length}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/10 bg-card/[0.03] backdrop-blur-lg p-10 text-muted-foreground">
          {debouncedQuery.trim() ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col gap-2 p-4 ${glassCard}`}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={`text-[10px] font-medium ${categoryColors[item.category] || ""}`}>
                  {item.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.excerpt}</p>
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-[10px] text-muted-foreground">{item.source}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
