import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { NewsItem } from "@/services/newsService";

const categoryGradients: Record<string, string> = {
  Marketing: "from-primary/30 via-primary/10 to-primary/5",
  Ads: "from-blue-500/30 via-blue-500/10 to-blue-500/5",
  Negócios: "from-emerald-500/30 via-emerald-500/10 to-emerald-500/5",
  IA: "from-violet-500/30 via-violet-500/10 to-violet-500/5",
  SEO: "from-amber-500/30 via-amber-500/10 to-amber-500/5",
  Social: "from-pink-500/30 via-pink-500/10 to-pink-500/5",
  Vendas: "from-orange-500/30 via-orange-500/10 to-orange-500/5",
  Design: "from-cyan-500/30 via-cyan-500/10 to-cyan-500/5",
};

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

interface NewsHeroCardProps {
  item: NewsItem;
}

export function NewsHeroCard({ item }: NewsHeroCardProps) {
  const gradient = categoryGradients[item.category] || categoryGradients.Marketing;
  const badgeColor = categoryColors[item.category] || "";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col rounded-2xl border border-border/10 bg-card/[0.06] backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
    >
      {/* Image / gradient placeholder */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        {item.image ? (
          <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`} />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </>
        )}
        {/* Bottom overlay for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

        {/* Category badge */}
        <Badge variant="outline" className={`absolute top-3 left-3 text-[10px] font-semibold backdrop-blur-md ${badgeColor}`}>
          {item.category}
        </Badge>

        {/* External link icon */}
        <ExternalLink className="absolute top-3 right-3 h-3.5 w-3.5 text-foreground/30 group-hover:text-primary transition-colors" />

        {/* Title overlayed at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 p-4 pb-3">
          <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </div>
      </div>

      {/* Content below image */}
      <div className="flex flex-col gap-1.5 p-4 pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {item.excerpt}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/70">{item.source}</span>
          <span className="text-[10px] text-muted-foreground/50">
            {new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
