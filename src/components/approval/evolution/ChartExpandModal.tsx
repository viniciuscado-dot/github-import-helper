import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChartExpandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: (startDate?: string, endDate?: string) => React.ReactNode;
}

const PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
] as const;

export function ChartExpandModal({ open, onOpenChange, title, children }: ChartExpandModalProps) {
  const [preset, setPreset] = useState<number | null>(30);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const getDateRange = () => {
    if (preset) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - preset);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }
    return { startDate: customStart || undefined, endDate: customEnd || undefined };
  };

  const { startDate, endDate } = getDateRange();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {PRESETS.map(p => (
            <Button
              key={p.days}
              size="sm"
              variant={preset === p.days ? "default" : "outline"}
              onClick={() => { setPreset(p.days); setCustomStart(""); setCustomEnd(""); }}
            >
              {p.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={preset === null ? "default" : "outline"}
            onClick={() => setPreset(null)}
          >
            Personalizado
          </Button>

          {preset === null && (
            <div className="flex items-center gap-2 ml-2">
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-36 h-9" />
              <span className="text-muted-foreground text-sm">até</span>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-36 h-9" />
            </div>
          )}
        </div>

        <div className="h-[500px]">
          {children(startDate, endDate)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
