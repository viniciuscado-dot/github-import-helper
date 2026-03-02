import { useState, useEffect } from "react";
import { Trophy, Star, ChevronRight } from "lucide-react";
import { layoutTokens } from "./layout/layoutTokens";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { computeClientRanking, type ClientRankingEntry } from "@/services/approvalDataService";
import type { ApprovalFilters } from "@/pages/Aprovacao";

interface ClientRankingCardProps {
  filters: ApprovalFilters;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map(i => {
        const full = i < Math.floor(rating);
        const half = !full && i === Math.floor(rating) && rating - Math.floor(rating) >= 0.25;
        return (
          <span key={i} className="relative inline-block" style={{ width: 14, height: 14 }}>
            <Star className="h-3.5 w-3.5 absolute inset-0 fill-transparent text-muted-foreground/25" />
            {full && <Star className="h-3.5 w-3.5 absolute inset-0 fill-amber-400 text-amber-400" />}
            {half && <Star className="h-3.5 w-3.5 absolute inset-0 fill-amber-400 text-amber-400" style={{ clipPath: "inset(0 50% 0 0)" }} />}
          </span>
        );
      })}
    </span>
  );
}

export function ClientRankingCard({ filters }: ClientRankingCardProps) {
  const [data, setData] = useState<ClientRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    computeClientRanking(filters).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [filters]);

  const top5 = data.slice(0, 5);

  return (
    <>
      <div className={`${layoutTokens.card.base} ${layoutTokens.card.padding}`}>
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ranking por Cliente</h2>
            <p className="text-xs text-muted-foreground">Média geral das avaliações</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : top5.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma avaliação registrada ainda.
          </p>
        ) : (
          <div className="space-y-1">
            {top5.map((entry) => (
              <div
                key={entry.clientName}
                className={`flex items-center gap-3 py-2.5 px-2 rounded-md transition-colors hover:bg-muted/30 ${
                  entry.position === 1 ? "bg-amber-500/5" : ""
                }`}
              >
                <span className="w-7 text-center flex-shrink-0">
                  {entry.position <= 3 ? (
                    <span className="text-lg">{MEDALS[entry.position - 1]}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground font-medium">#{entry.position}</span>
                  )}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {entry.clientName}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-sm font-semibold text-foreground">{entry.avgRating.toFixed(1)}</span>
                  <MiniStars rating={entry.avgRating} />
                </div>
              </div>
            ))}
          </div>
        )}

        {data.length > 5 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 mt-4 text-xs text-muted-foreground/70 hover:text-primary transition-colors"
          >
            Ver tudo <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Modal completo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking Completo de Clientes
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-3 font-medium w-16">Pos.</th>
                  <th className="text-left py-3 px-3 font-medium">Cliente</th>
                  <th className="text-right py-3 px-3 font-medium">Nota Média</th>
                  <th className="text-right py-3 px-3 font-medium">Avaliações</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr
                    key={entry.clientName}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      {entry.position <= 3 ? (
                        <span className="text-lg">{MEDALS[entry.position - 1]}</span>
                      ) : (
                        <span className="text-muted-foreground font-medium">{entry.position}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{entry.clientName}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{entry.avgRating.toFixed(1)}</span>
                        <MiniStars rating={entry.avgRating} />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground">
                      {entry.totalReviews} {entry.totalReviews === 1 ? "avaliação" : "avaliações"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
