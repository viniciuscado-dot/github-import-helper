import { ReactNode } from "react";
import { layoutTokens } from "./layoutTokens";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        layoutTokens.container.maxWidth,
        layoutTokens.container.mx,
        layoutTokens.container.paddingX,
        layoutTokens.spacing.sectionGap,
        "py-6",
        className
      )}
      style={{ scrollbarGutter: "stable" }}
    >
      {children}
    </div>
  );
}
