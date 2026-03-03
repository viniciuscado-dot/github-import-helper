import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, Video, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface AgendaEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "meeting" | "task" | "reminder";
  location?: string;
  isOnline?: boolean;
}

const typeConfig: Record<AgendaEvent["type"], { label: string; className: string }> = {
  meeting: { label: "Reunião", className: "bg-primary/15 text-primary border-primary/30" },
  task: { label: "Tarefa", className: "bg-secondary/15 text-secondary border-secondary/30" },
  reminder: { label: "Lembrete", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
};

// Mock events — will be replaced by Google Calendar integration
const mockEvents: AgendaEvent[] = [
  { id: "1", title: "Daily de Criação", startTime: "09:00", endTime: "09:30", type: "meeting", isOnline: true },
  { id: "2", title: "Revisão de materiais — Cliente X", startTime: "10:00", endTime: "11:00", type: "task" },
  { id: "3", title: "Alinhamento de campanha Q2", startTime: "14:00", endTime: "15:00", type: "meeting", location: "Sala 3" },
  { id: "4", title: "Deadline: Entrega LP Novo Produto", startTime: "17:00", endTime: "17:30", type: "reminder" },
];

interface AgendaPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgendaPanel({ open, onOpenChange }: AgendaPanelProps) {
  const today = new Date();
  const [events] = useState<AgendaEvent[]>(mockEvents);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            Agenda do dia
          </SheetTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum compromisso hoje</p>
            </div>
          ) : (
            events.map((event) => {
              const cfg = typeConfig[event.type];
              return (
                <div
                  key={event.id}
                  className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground leading-snug">{event.title}</h3>
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${cfg.className}`}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.startTime} – {event.endTime}
                    </span>
                    {event.isOnline && (
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" /> Online
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Separator />
        <div className="px-5 py-3">
          <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground" disabled>
            <ExternalLink className="h-3 w-3" />
            Conectar Google Calendar (em breve)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
