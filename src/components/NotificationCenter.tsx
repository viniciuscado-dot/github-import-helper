import { useState, useMemo } from "react";
import { Bell, CheckCircle, AlertTriangle, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: "approved" | "adjustment" | "evaluated" | "info";
  client: string;
  materialName: string;
  timestamp: Date;
  read: boolean;
}

const typeConfig = {
  approved: {
    icon: CheckCircle,
    label: "Aprovado",
    color: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  adjustment: {
    icon: AlertTriangle,
    label: "Ajuste solicitado",
    color: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  evaluated: {
    icon: Edit3,
    label: "Avaliado pelo cliente",
    color: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  info: {
    icon: Bell,
    label: "Informação",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

// Seed notifications for demo
const seedNotifications: AppNotification[] = [
  {
    id: "1",
    type: "approved",
    client: "Clínica Estética Bella",
    materialName: "Post Carrossel — Maio",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    read: false,
  },
  {
    id: "2",
    type: "adjustment",
    client: "Academia FitPro",
    materialName: "Vídeo Reels — Campanha Verão",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
  },
  {
    id: "3",
    type: "evaluated",
    client: "Restaurante Sabor & Arte",
    materialName: "Banner Stories — Promoção",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
  },
  {
    id: "4",
    type: "approved",
    client: "Advocacia Silva & Associados",
    materialName: "Landing Page — Captação",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
  },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 bg-popover border border-border shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const cfg = typeConfig[notif.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
                      !notif.read && "bg-accent/20"
                    )}
                  >
                    {/* Status dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", cfg.color)} />
                        <span className={cn("text-xs font-medium", cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-foreground truncate">
                        {notif.materialName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notif.client}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                      {formatRelativeTime(notif.timestamp)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
