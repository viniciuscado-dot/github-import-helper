import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNews, type NewsItem } from "@/services/newsService";

const categoryColors: Record<string, string> = {
  Marketing: "bg-primary/10 text-primary border-primary/20",
  Ads: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Negócios: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Notícias</h2>
          <p className="text-xs text-muted-foreground">Marketing, publicidade e negócios.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/50 p-10 text-muted-foreground">
          <p className="text-sm">Nenhuma notícia disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-lg hover:shadow-primary/5"
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
