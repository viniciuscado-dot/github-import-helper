import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApprovalKanban } from "./ApprovalKanban";
import type { ApprovalFilters } from "@/pages/Aprovacao";

interface ApprovalKanbanViewProps {
  filters: ApprovalFilters;
  initialStatusFilter?: string;
}

type SpecialView = "none" | "archived" | "deleted";

export function ApprovalKanbanView({ filters, initialStatusFilter }: ApprovalKanbanViewProps) {
  const [specialView, setSpecialView] = useState<SpecialView>("none");

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Kanban de Aprovações</h1>

      <div className="flex gap-3 min-h-[36px]">
        <Button
          variant={specialView === "archived" || specialView === "deleted" ? "default" : "outline"}
          onClick={() => setSpecialView(specialView !== "none" ? "none" : "archived")}
          className="gap-1.5"
          size="sm"
        >
          <FileText className="h-3.5 w-3.5" />
          {specialView === "archived" ? "Mostrando Arquivados" : specialView === "deleted" ? "Mostrando Lixeira" : "Materiais Arquivados"}
        </Button>
        <Button
          variant={specialView === "deleted" ? "default" : "outline"}
          onClick={() => setSpecialView(specialView === "deleted" ? "archived" : "deleted")}
          className={`gap-1.5 ${specialView === "archived" || specialView === "deleted" ? "" : "invisible"}`}
          size="sm"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Lixeira
        </Button>
      </div>

      <ApprovalKanban
        showArchived={specialView === "archived"}
        showDeleted={specialView === "deleted"}
        filters={filters}
      />
    </>
  );
}
