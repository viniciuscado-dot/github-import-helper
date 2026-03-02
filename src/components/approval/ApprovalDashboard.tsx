import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle, PenLine, TrendingUp, TrendingDown, Minus, Star, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./layout/PageHeader";
import { KPICard } from "./layout/KPICard";
import { RankingTable } from "./layout/RankingTable";
import { SquadRankingTable } from "./layout/SquadRankingTable";
import { ClientRankingCard } from "./ClientRankingCard";
import { layoutTokens } from "./layout/layoutTokens";
import {
  computeKPIs,
  computeUnifiedRanking,
  computeSquadRanking,
  type SquadRankingEntry,
} from "@/services/approvalDataService";
import type { ApprovalFilters } from "@/pages/Aprovacao";

interface ApprovalDashboardProps {
  filters: ApprovalFilters;
  filterSetters: {
    setCreator: (v: string) => void;
    setSquad: (v: string) => void;
    setClient: (v: string) => void;
    setMaterialType: (v: string) => void;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
  };
  onNavigateToKanban: (statusFilter?: string) => void;
}

export function ApprovalDashboard({ filters, filterSetters, onNavigateToKanban }: ApprovalDashboardProps) {
  const [kpis, setKpis] = useState({ pendentes: 0, emAjustes: 0, aprovados: 0, total: 0, avgRating: 0, avgRatingTrend: null as "up" | "down" | "stable" | null, squadHighlight: { squad: "—", avgRating: 0 } });
  const [ranking, setRanking] = useState<{ position: number; name: string; materialsEvaluated: number; avgRating: number }[]>([]);
  const [squadRanking, setSquadRanking] = useState<SquadRankingEntry[]>([]);

  useEffect(() => {
    computeKPIs(filters).then(setKpis);
    computeUnifiedRanking(filters).then(setRanking);
    computeSquadRanking(filters).then(setSquadRanking);
  }, [filters]);

  return (
    <>
      <PageHeader title="Aprovação" />

      {/* KPIs */}
      <div className={`${layoutTokens.grid.cols3} ${layoutTokens.spacing.gridGap}`}>
        <KPICard
          label="Materiais em Aprovação"
          value={kpis.pendentes}
          icon={<Send className="h-5 w-5" />}
          iconBgClass="bg-blue-500/15 text-blue-500"
          variant="large"
          onClick={() => onNavigateToKanban("pendentes")}
        />
        <KPICard
          label="Em Ajuste"
          value={kpis.emAjustes}
          icon={<PenLine className="h-5 w-5" />}
          iconBgClass="bg-destructive/15 text-destructive"
          variant="large"
          onClick={() => onNavigateToKanban("em_ajustes")}
        />
        <KPICard
          label="Aprovados"
          value={kpis.aprovados}
          icon={<CheckCircle className="h-5 w-5" />}
          iconBgClass="bg-success/15 text-success"
          variant="large"
          onClick={() => onNavigateToKanban("aprovado")}
        />
      </div>

      {/* Secondary KPIs */}
      <div className={`${layoutTokens.grid.cols2} ${layoutTokens.spacing.gridGap}`}>
        <KPICard
          label="Média de Aprovação Geral"
          value={
            <span className="flex items-center gap-2">
              {kpis.avgRating.toFixed(1)}
              {kpis.avgRatingTrend === "up" && <TrendingUp className="h-5 w-5 text-success" />}
              {kpis.avgRatingTrend === "down" && <TrendingDown className="h-5 w-5 text-destructive" />}
              {kpis.avgRatingTrend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
            </span>
          }
          icon={<Star className="h-5 w-5" />}
          iconBgClass="bg-primary/15 text-primary"
          variant="large"
        />
        <KPICard
          label="Squad Destaque"
          value={kpis.squadHighlight.squad}
          subtitle={
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-foreground">{kpis.squadHighlight.avgRating.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(i => {
                  const rating = kpis.squadHighlight.avgRating;
                  const fullStars = Math.floor(rating);
                  const fraction = rating - fullStars;
                  const isFull = i < fullStars || (i === fullStars && fraction >= 0.75);
                  const isHalf = !isFull && i === fullStars && fraction >= 0.25;
                  return (
                    <span key={i} className="relative inline-block" style={{ width: 18, height: 18 }}>
                      <Star className="h-[18px] w-[18px] absolute inset-0 fill-transparent text-muted-foreground/25" />
                      {isFull && <Star className="h-[18px] w-[18px] absolute inset-0 fill-amber-400 text-amber-400" />}
                      {isHalf && <Star className="h-[18px] w-[18px] absolute inset-0 fill-amber-400 text-amber-400" style={{ clipPath: "inset(0 50% 0 0)" }} />}
                    </span>
                  );
                })}
              </div>
            </div>
          }
          icon={<Trophy className="h-5 w-5" />}
          iconBgClass="bg-warning/15 text-warning"
          variant="large"
        />
      </div>

      {/* Ranking */}
      <div className={`${layoutTokens.card.base} ${layoutTokens.card.padding}`}>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Ranking por Pessoa</h2>
        </div>
        <RankingTable
          data={ranking}
          onNameClick={(name) => filterSetters.setCreator(filters.creator === name ? "all" : name)}
        />
      </div>

      {/* Squad + Client Rankings side by side */}
      <div className={`${layoutTokens.grid.cols2} ${layoutTokens.spacing.gridGap}`}>
        {/* Squad Ranking */}
        <div className={`${layoutTokens.card.base} ${layoutTokens.card.padding}`}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Ranking por Squad</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Desempenho das squads no período filtrado</p>
          <SquadRankingTable data={squadRanking} />
        </div>

        {/* Client Ranking */}
        <ClientRankingCard filters={filters} />
      </div>
    </>
  );
}
