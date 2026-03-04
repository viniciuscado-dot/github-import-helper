import { cn } from "@/lib/utils";

interface TimelineStage {
  title: string;
  time: string;
  description: string;
}

const stages: TimelineStage[] = [
  { title: "ONBOARDING", time: "1º mês", description: "ORGANIZAÇÃO" },
  { title: "MÊS TESTE", time: "2º mês", description: "PRIMEIROS LEADS" },
  { title: "REFINAMENTO", time: "3º ao 5º mês", description: "MQL & OTIMIZAÇÃO" },
  { title: "ESCALA", time: "6º mês", description: "VOLUME & EFICIÊNCIA" },
  { title: "EXPANSÃO", time: "7º mês+", description: "NOVOS VALORES" },
];

interface StrategyTimelineProps {
  /** 0-based index of the current active stage */
  currentStage?: number;
}

export function StrategyTimeline({ currentStage = 0 }: StrategyTimelineProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-stretch min-w-[640px]">
        {stages.map((stage, i) => {
          const isPast = i < currentStage;
          const isCurrent = i === currentStage;
          const isFuture = i > currentStage;

          return (
            <div key={stage.title} className="flex-1 flex flex-col items-center relative">
              {/* Funnel / triangle shape */}
              <div className="relative w-full flex justify-center">
                <svg
                  viewBox="0 0 120 40"
                  className="w-full h-10"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points="0,0 120,0 110,40 10,40"
                    className={cn(
                      "transition-colors duration-300",
                      isCurrent && "fill-primary",
                      isPast && "fill-primary/70",
                      isFuture && "fill-muted"
                    )}
                  />
                </svg>
                {/* Connector line between triangles */}
                {i < stages.length - 1 && (
                  <div
                    className={cn(
                      "absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0",
                    )}
                  />
                )}
              </div>

              {/* Content below triangle */}
              <div className="flex flex-col items-center gap-1.5 mt-3 px-1">
                {/* Title */}
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

                {/* Time badge */}
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

                {/* Description */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
