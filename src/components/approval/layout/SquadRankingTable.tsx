import { cn } from "@/lib/utils";
import { Star, Users } from "lucide-react";
import type { SquadRankingEntry } from "@/services/approvalDataService";

const SQUAD_COLORS: Record<string, string> = {
  Athena: "border-blue-400/50 text-blue-600 dark:text-blue-400 bg-blue-500/10",
  Ártemis: "border-emerald-400/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  Ares: "border-red-400/50 text-red-600 dark:text-red-400 bg-red-500/10",
  Apollo: "border-amber-400/50 text-amber-600 dark:text-amber-400 bg-amber-500/10",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
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
          <span key={i} className="relative inline-block" style={{ width: 14, height: 14 }}>
            <Star className="h-3.5 w-3.5 absolute inset-0 fill-transparent text-muted-foreground/25" />
            {isFull && <Star className="h-3.5 w-3.5 absolute inset-0 fill-amber-400 text-amber-400" />}
            {isHalf && (
              <Star
                className="h-3.5 w-3.5 absolute inset-0 fill-amber-400 text-amber-400"
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

interface SquadRankingTableProps {
  data: SquadRankingEntry[];
}

export function SquadRankingTable({ data }: SquadRankingTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sem dados de squad para o período selecionado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium w-16">Posição</th>
            <th className="text-left py-3 px-3 font-medium">Squad</th>
            <th className="text-center py-3 px-3 font-medium">Materiais Avaliados</th>
            <th className="text-right py-3 px-3 font-medium">Nota Média</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => {
            const colorClass = SQUAD_COLORS[entry.squad] || "border-border text-muted-foreground bg-muted/30";
            return (
              <tr
                key={entry.squad}
                className="border-b border-border/20 hover:bg-muted/30 transition-colors"
              >
                <td className="py-4 px-3">
                  {entry.position <= 3 ? (
                    <span className="text-xl">{MEDALS[entry.position - 1]}</span>
                  ) : (
                    <span className="text-muted-foreground font-medium pl-1">{entry.position}</span>
                  )}
                </td>
                <td className="py-4 px-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      colorClass
                    )}
                  >
                    {entry.squad}
                  </span>
                  {entry.lowSample && (
                    <span className="ml-2 text-[10px] text-muted-foreground italic">amostra baixa</span>
                  )}
                </td>
                <td className="py-4 px-3 text-center text-foreground">{entry.materialsEvaluated}</td>
                <td className="py-4 px-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="font-medium text-foreground">{entry.avgRating.toFixed(1)}</span>
                    <StarRating rating={entry.avgRating} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
