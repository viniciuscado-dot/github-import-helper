import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface TimelineStage {
  id: string;
  title: string;
  time: string;
}

export const STRATEGY_STAGES: TimelineStage[] = [
  { id: "onboarding", title: "ONBOARDING", time: "1º mês" },
  { id: "mes_teste", title: "MÊS TESTE", time: "2º mês" },
  { id: "refinamento", title: "REFINAMENTO", time: "3º ao 5º mês" },
  { id: "escala", title: "ESCALA", time: "6º mês" },
  { id: "expansao", title: "EXPANSÃO", time: "7º mês+" },
];

interface StrategyTimelineProps {
  currentStage?: number;
  onStageClick?: (index: number) => void;
}

export function StrategyTimeline({ currentStage = 0, onStageClick }: StrategyTimelineProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1.5 min-w-[600px] p-1">
        {STRATEGY_STAGES.map((stage, i) => {
          const isPast = i < currentStage;
          const isCurrent = i === currentStage;
          const isFuture = i > currentStage;

          return (
            <motion.button
              key={stage.id}
              type="button"
              onClick={() => onStageClick?.(i)}
              initial={false}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex-1 rounded-xl px-4 py-3 transition-all duration-300",
                "flex flex-col items-center justify-center gap-1",
                "border backdrop-blur-sm",
                onStageClick && "cursor-pointer",
                isCurrent && [
                  "bg-primary text-primary-foreground",
                  "border-primary/50",
                  "shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]",
                ],
                isPast && [
                  "bg-primary/10 text-primary",
                  "border-primary/20",
                ],
                isFuture && [
                  "bg-muted/50 text-muted-foreground",
                  "border-border/50",
                  "hover:bg-muted/80 hover:border-border",
                ],
              )}
            >
              {/* Active indicator dot */}
              {isCurrent && (
                <motion.div
                  layoutId="timeline-active"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Title */}
              <span
                className={cn(
                  "text-[12px] font-bold tracking-wide leading-none",
                  isCurrent && "text-primary-foreground",
                  isPast && "text-primary",
                  isFuture && "text-muted-foreground",
                )}
              >
                {stage.title}
              </span>

              {/* Time below */}
              <span
                className={cn(
                  "text-[10px] font-medium leading-none mt-0.5",
                  isCurrent && "text-primary-foreground/70",
                  isPast && "text-primary/60",
                  isFuture && "text-muted-foreground/60",
                )}
              >
                {stage.time}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
