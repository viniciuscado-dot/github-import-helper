import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AgendaPanel } from "@/components/AgendaPanel";

export function TopBar() {
  const [agendaOpen, setAgendaOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-20 w-full">
        <div className="flex items-center justify-end h-10 gap-2 pr-4 md:pr-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-200"
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
