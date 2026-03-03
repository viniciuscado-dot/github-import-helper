import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AgendaPanel } from "@/components/AgendaPanel";

export function TopBar() {
  const [agendaOpen, setAgendaOpen] = useState(false);

  return (
    <>
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 md:px-6 flex items-center justify-end h-10 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
            onClick={() => setAgendaOpen(true)}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ver Agenda</span>
          </Button>
          <NotificationCenter />
        </div>
      </div>
      <AgendaPanel open={agendaOpen} onOpenChange={setAgendaOpen} />
    </>
  );
}
