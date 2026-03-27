import { cn } from "@/lib/utils";
import { ReactNode, useRef, useCallback } from "react";

interface KPICardProps {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  variant?: "large" | "compact";
  iconBgClass?: string;
  onClick?: () => void;
}

export function KPICard({ label, value, subtitle, icon, variant = "large", iconBgClass, onClick }: KPICardProps) {
  const isLarge = variant === "large";

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border/60 bg-card text-left transition-all hover:shadow-md hover:border-primary/30 w-full",
        isLarge ? "p-5 md:p-6" : "p-3 md:p-4",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-muted-foreground font-medium block",
            isLarge ? "text-sm" : "text-xs"
          )}>
            {label}
          </span>
          <p className={cn(
            "font-bold mt-1 text-foreground",
            isLarge ? "text-3xl" : "text-xl"
          )}>
            {value}
          </p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        {icon && (
          <div className={cn(
            "flex items-center justify-center rounded-xl shrink-0",
            isLarge ? "h-12 w-12" : "h-9 w-9",
            iconBgClass || "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
      </div>
    </button>
  );
}
