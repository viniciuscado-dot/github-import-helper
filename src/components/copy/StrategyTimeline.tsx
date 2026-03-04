import { cn } from "@/lib/utils";

export interface TimelineStage {
  id: string;
  title: string;
  time: string;
  description: string;
}

export const STRATEGY_STAGES: TimelineStage[] = [
  { id: "onboarding", title: "ONBOARDING", time: "1º mês", description: "ORGANIZAÇÃO" },
  { id: "mes_teste", title: "MÊS TESTE", time: "2º mês", description: "PRIMEIROS LEADS" },
  { id: "refinamento", title: "REFINAMENTO", time: "3º ao 5º mês", description: "MQL & OTIMIZAÇÃO" },
  { id: "escala", title: "ESCALA", time: "6º mês", description: "VOLUME & EFICIÊNCIA" },
  { id: "expansao", title: "EXPANSÃO", time: "7º mês+", description: "NOVOS VALORES" },
];

interface StrategyTimelineProps {
  /** 0-based index of the current active stage */
  currentStage?: number;
  onStageClick?: (index: number) => void;
}

export function StrategyTimeline({ currentStage = 0, onStageClick }: StrategyTimelineProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-stretch min-w-[640px]">
        {STRATEGY_STAGES.map((stage, i) => {
          const isPast = i < currentStage;
          const isCurrent = i === currentStage;
          const isFuture = i > currentStage;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageClick?.(i)}
              className={cn(
                "flex-1 flex flex-col items-center relative transition-opacity",
                "hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
                onStageClick && "cursor-pointer"
              )}
            >
              {/* Arrow / chevron shape */}
              <div className="relative w-full flex justify-center">
                <svg
                  viewBox="0 0 120 40"
                  className="w-full h-10"
                  preserveAspectRatio="none"
                >
                  {/* Main trapezoid body */}
                  <polygon
                    points={i === 0 ? "0,0 110,0 120,20 110,40 0,40" : "0,0 110,0 120,20 110,40 0,40 10,20"}
                    className={cn(
                      "transition-colors duration-300",
                      isCurrent && "fill-primary",
                      isPast && "fill-primary/70",
                      isFuture && "fill-muted"
                    )}
                  />
                </svg>
              </div>

              {/* Content below shape */}
              <div className="flex flex-col items-center gap-1.5 mt-3 px-1">
                <span
                  className={cn(
                    "text-xs font-bold tracking-wide text-center leading-tight",
                    isCurrent && "text-primary",
                    isPast && "text-foreground",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {stage.title}
                </span>

                <span
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-0.5 rounded-full border text-center whitespace-nowrap",
                    isCurrent && "border-primary/60 bg-primary/10 text-primary",
                    isPast && "border-primary/40 bg-primary/5 text-primary/80",
                    isFuture && "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  {stage.time}
                </span>

                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wider text-center italic leading-tight",
                    isCurrent && "text-foreground/80",
                    isPast && "text-foreground/60",
                    isFuture && "text-muted-foreground/60"
                  )}
                >
                  {stage.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
