import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { NewsThumbnail } from "@/components/home/NewsThumbnail";
import type { NewsItem } from "@/services/newsService";

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

interface NewsListItemProps {
  item: NewsItem;
  index?: number;
  onImageGenerated?: (id: string, url: string) => void;
}

export function NewsListItem({ item, index = 0, onImageGenerated }: NewsListItemProps) {
  const badgeColor = categoryColors[item.category] || categoryColors.Marketing;

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
      className="group flex items-start gap-3 p-3 rounded-xl border border-border/10 bg-card/[0.06] backdrop-blur-lg transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-px flex-1"
    >
      {/* Thumbnail with category badge */}
      <NewsThumbnail item={item} className="shrink-0 w-28 h-20 rounded-lg" onImageGenerated={onImageGenerated}>
        {item.image && <div className="absolute inset-0 bg-black/40" />}
        <Badge
          variant="outline"
          className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0 h-4 leading-none backdrop-blur-md ${badgeColor}`}
        >
          {item.category}
        </Badge>
      </NewsThumbnail>

      {/* Info */}
      <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <p className="text-xs text-muted-foreground/50 leading-relaxed line-clamp-1">
          {item.excerpt}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <span>{item.source}</span>
          <span>·</span>
          <span>
            {new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
