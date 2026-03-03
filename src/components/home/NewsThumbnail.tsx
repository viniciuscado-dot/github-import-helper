import { useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { generateThumbnail } from "@/services/newsService";
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

/** Shared set across all instances to deduplicate generation calls */
const generatingSet = new Set<string>();

interface NewsThumbnailProps {
  item: NewsItem;
  className?: string;
  onImageGenerated?: (id: string, url: string) => void;
  /** Extra content rendered on top of the image (badges, overlays, etc.) */
  children?: React.ReactNode;
}

export function NewsThumbnail({ item, className = "", onImageGenerated, children }: NewsThumbnailProps) {
  const [broken, setBroken] = useState(false);
  const [generating, setGenerating] = useState(false);
  const attemptedRef = useRef(false);

  const gradient = categoryGradients[item.category] || categoryGradients.Marketing;

  const hasValidImage = item.image && item.image.trim().length > 0 && !broken;

  const triggerGeneration = useCallback(async () => {
    if (attemptedRef.current || generatingSet.has(item.id)) return;
    attemptedRef.current = true;
    generatingSet.add(item.id);
    setGenerating(true);

    const url = await generateThumbnail(item.title, item.category, item.excerpt, item.url);
    setGenerating(false);
    generatingSet.delete(item.id);

    if (url) {
      onImageGenerated?.(item.id, url);
    }
  }, [item.id, item.title, item.category, item.excerpt, item.url, onImageGenerated]);

  const handleError = useCallback(() => {
    setBroken(true);
    triggerGeneration();
  }, [triggerGeneration]);

  // If no image at all, trigger generation on mount (once)
  if (!item.image || item.image.trim().length === 0) {
    if (!attemptedRef.current && !generatingSet.has(item.id)) {
      // Use microtask to avoid setState during render
      queueMicrotask(() => triggerGeneration());
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {hasValidImage ? (
        <img
          src={item.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={handleError}
        />
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`} />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {generating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-foreground/20 animate-spin" />
            </div>
          )}
        </>
      )}
      {children}
    </div>
  );
}
