import { ReactNode } from "react";
import { layoutTokens } from "./layoutTokens";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(layoutTokens.header.wrapper, className)}>
      <h1 className={layoutTokens.header.title}>{title}</h1>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
