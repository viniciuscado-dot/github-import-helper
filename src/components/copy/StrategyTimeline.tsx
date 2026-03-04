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
  currentStage?: number;
  onStageClick?: (index: number) => void;
}

export function StrategyTimeline({ currentStage = 0, onStageClick }: StrategyTimelineProps) {
  const total = STRATEGY_STAGES.length;

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex min-w-[700px] h-[72px]">
        {STRATEGY_STAGES.map((stage, i) => {
          const isPast = i < currentStage;
          const isCurrent = i === currentStage;
          const isFirst = i === 0;
          const isLast = i === total - 1;

          // Colors based on state
          const bgColor = isCurrent
            ? "hsl(var(--primary))"
            : isPast
              ? "hsl(var(--primary) / 0.6)"
              : "hsl(var(--muted))";

          const borderColor = isCurrent
            ? "hsl(var(--primary) / 0.8)"
            : isPast
              ? "hsl(var(--primary) / 0.4)"
              : "hsl(var(--border))";

          // Arrow notch depth
          const notch = 14;

          // Build chevron/arrow path
          // Each segment: flat left (or notched), top edge, arrow tip, bottom edge, back to start
          const w = 200;
          const h = 72;
          const path = isFirst
            ? `M 0,0 L ${w - notch},0 L ${w},${h / 2} L ${w - notch},${h} L 0,${h} Z`
            : isLast
              ? `M 0,0 L ${w},0 L ${w},${h} L 0,${h} L ${notch},${h / 2} Z`
              : `M 0,0 L ${w - notch},0 L ${w},${h / 2} L ${w - notch},${h} L 0,${h} L ${notch},${h / 2} Z`;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageClick?.(i)}
              className={cn(
                "relative flex-1 focus:outline-none focus-visible:z-10",
                "transition-all duration-200",
                onStageClick && "cursor-pointer group"
              )}
              style={{ marginLeft: i > 0 ? `-${notch}px` : undefined, zIndex: total - i }}
            >
              <svg
                viewBox={`0 0 ${w} ${h}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Shadow/glow for active */}
                {isCurrent && (
                  <path
                    d={path}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeWidth="3"
                    className="blur-[2px]"
                  />
                )}
                {/* Main shape */}
                <path
                  d={path}
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth="1"
                  className="transition-all duration-300 group-hover:brightness-110"
                />
              </svg>

              {/* Content inside the arrow */}
              <div
                className="relative z-10 h-full flex flex-col items-center justify-center gap-0.5"
                style={{ paddingLeft: !isFirst ? `${notch / 2}px` : undefined, paddingRight: !isLast ? `${notch / 2}px` : undefined }}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold tracking-wide leading-none",
                    isCurrent && "text-primary-foreground",
                    isPast && "text-primary-foreground/90",
                    !isCurrent && !isPast && "text-muted-foreground"
                  )}
                >
                  {stage.title}
                </span>

                <span
                  className={cn(
                    "text-[9px] font-medium px-2 py-px rounded-full border leading-none mt-1",
                    isCurrent && "border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground",
                    isPast && "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground/80",
                    !isCurrent && !isPast && "border-border bg-background/50 text-muted-foreground"
                  )}
                >
                  {stage.time}
                </span>

                <span
                  className={cn(
                    "text-[8px] font-medium tracking-widest leading-none mt-0.5 italic",
                    isCurrent && "text-primary-foreground/80",
                    isPast && "text-primary-foreground/60",
                    !isCurrent && !isPast && "text-muted-foreground/60"
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
