import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface RankingEntry {
  position: number;
  name: string;
  materialsEvaluated: number;
  avgRating: number;
}

interface RankingTableProps {
  data: RankingEntry[];
  onNameClick?: (name: string) => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function StarRating({ rating, max = 5, starSize = "h-3.5 w-3.5" }: { rating: number; max?: number; starSize?: string }) {
  const normalized = Math.min(rating, max);
  const fullStars = Math.floor(normalized);
  const fraction = normalized - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const extraFull = fraction >= 0.75;

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const isFull = i < fullStars || (i === fullStars && extraFull);
        const isHalf = !isFull && i === fullStars && hasHalf;
        return (
          <span key={i} className="relative inline-block" style={{ width: starSize === "h-4 w-4" ? 16 : 14, height: starSize === "h-4 w-4" ? 16 : 14 }}>
            {/* Empty star background */}
            <Star className={cn(starSize, "absolute inset-0 fill-transparent text-muted-foreground/25")} />
            {isFull && (
              <Star className={cn(starSize, "absolute inset-0 fill-amber-400 text-amber-400")} />
            )}
            {isHalf && (
              <Star
                className={cn(starSize, "absolute inset-0 fill-amber-400 text-amber-400")}
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

export function RankingTable({ data, onNameClick }: RankingTableProps) {
  const filtered = data;

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sem dados para o período selecionado.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-3 font-medium w-16">Posição</th>
              <th className="text-left py-3 px-3 font-medium">Nome</th>
              <th className="text-center py-3 px-3 font-medium">Materiais Avaliados</th>
              <th className="text-right py-3 px-3 font-medium">Nota Média</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr
                key={entry.name + entry.position}
                className="border-b border-border/20 hover:bg-muted/30 transition-colors"
              >
                <td className="py-4 px-3">
                  {entry.position <= 3 ? (
                    <span className="text-xl">{MEDALS[entry.position - 1]}</span>
                  ) : (
                    <span className="text-muted-foreground font-medium pl-1">{entry.position}</span>
                  )}
                </td>
                <td className="py-4 px-3 font-medium text-foreground">
                  {onNameClick ? (
                    <button
                      onClick={() => onNameClick(entry.name)}
                      className="hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer text-left"
                    >
                      {entry.name}
                    </button>
                  ) : entry.name}
                </td>
                <td className="py-4 px-3 text-center text-foreground">{entry.materialsEvaluated}</td>
                <td className="py-4 px-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="font-medium text-foreground">{entry.avgRating.toFixed(1)}</span>
                    <StarRating rating={entry.avgRating} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
