import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNews, type NewsItem } from "@/services/newsService";
import { NewsHeroCard } from "@/components/home/NewsHeroCard";
import { NewsListItem } from "@/components/home/NewsListItem";

const glassSection =
  "rounded-2xl border border-border/10 bg-card/[0.04] backdrop-blur-xl shadow-sm";

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

  const isSearchActive = debouncedQuery.trim().length > 0;
  const heroItem = !isSearchActive && filtered.length > 0 ? filtered[0] : null;
  const listItems = !isSearchActive ? filtered.slice(1, 4) : filtered;
  const hasMore = !isSearchActive && filtered.length > 4;

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
      {isSearchActive && !loading && (
        <p className="text-[10px] text-muted-foreground mb-2">
          Exibindo {filtered.length} de {news.length}
        </p>
      )}

      {loading ? (
        /* Loading skeletons — editorial layout */
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
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
      ) : isSearchActive ? (
        /* Search active — flat list */
        <div className="flex flex-col gap-3">
          {listItems.map((item, i) => (
            <NewsListItem key={item.id} item={item} index={i} />
          ))}
        </div>
      ) : (
        /* Default — editorial hero + side list */
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
          {heroItem && <NewsHeroCard item={heroItem} />}
          <div className="flex flex-col gap-3">
            {listItems.map((item, i) => (
              <NewsListItem key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
