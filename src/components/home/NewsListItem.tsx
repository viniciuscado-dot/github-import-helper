import { motion } from "framer-motion";
import type { NewsItem } from "@/services/newsService";

const categoryGradients: Record<string, string> = {
  Marketing: "from-primary/25 to-primary/5",
  Ads: "from-blue-500/25 to-blue-500/5",
  Negócios: "from-emerald-500/25 to-emerald-500/5",
};

const categoryDots: Record<string, string> = {
  Marketing: "bg-primary",
  Ads: "bg-blue-500",
  Negócios: "bg-emerald-500",
};

interface NewsListItemProps {
  item: NewsItem;
  index?: number;
}

export function NewsListItem({ item, index = 0 }: NewsListItemProps) {
  const gradient = categoryGradients[item.category] || categoryGradients.Marketing;
  const dot = categoryDots[item.category] || "bg-primary";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
      className="group flex items-start gap-3 p-3 rounded-xl border border-border/10 bg-card/[0.06] backdrop-blur-lg transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-px"
    >
      {/* Thumbnail placeholder */}
      <div className={`shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="w-full h-full opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <p className="text-xs text-muted-foreground/50 leading-relaxed line-clamp-1">
          {item.excerpt}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
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
