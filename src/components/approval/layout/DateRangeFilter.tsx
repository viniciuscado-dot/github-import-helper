import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  responsible: string;
  onResponsibleChange: (v: string) => void;
  client: string;
  onClientChange: (v: string) => void;
  squad: string;
  onSquadChange: (v: string) => void;
  materialType?: string;
  onMaterialTypeChange?: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  responsibleOptions: { value: string; label: string }[];
  responsibleLabel?: string;
  clientOptions: string[];
  squadOptions: string[];
  onPreset?: (preset: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function DateRangeFilter({
  responsible, onResponsibleChange,
  client, onClientChange,
  squad, onSquadChange,
  materialType, onMaterialTypeChange,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  responsibleOptions,
  responsibleLabel = "Responsável",
  clientOptions,
  squadOptions,
  onPreset,
  onClearFilters,
  className,
}: DateRangeFilterProps) {
  const handlePreset = (days: number | "month" | "lastMonth") => {
    const now = new Date();
    let start: string;
    let end: string;
    if (days === "lastMonth") {
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      start = firstLastMonth.toISOString().split("T")[0];
      end = lastLastMonth.toISOString().split("T")[0];
    } else if (days === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      end = now.toISOString().split("T")[0];
    } else {
      start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      end = now.toISOString().split("T")[0];
    }
    onStartDateChange(start);
    onEndDateChange(end);
    onPreset?.(String(days));
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{responsibleLabel}</Label>
          <Select value={responsible} onValueChange={onResponsibleChange}>
            <SelectTrigger className="bg-background h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {responsibleOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
          <Select value={client} onValueChange={onClientChange}>
            <SelectTrigger className="bg-background h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clientOptions.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Squad</Label>
          <Select value={squad} onValueChange={onSquadChange}>
            <SelectTrigger className="bg-background h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {squadOptions.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onMaterialTypeChange && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tipo de material</Label>
            <Select value={materialType || "all"} onValueChange={onMaterialTypeChange}>
              <SelectTrigger className="bg-background h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="estaticos">Estáticos</SelectItem>
                <SelectItem value="videos">Vídeos</SelectItem>
                <SelectItem value="carrossel">Carrossel</SelectItem>
                <SelectItem value="landing_page">Landing Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Data Inicial</Label>
          <Input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="bg-background h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Data Final</Label>
          <Input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="bg-background h-9" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset(7)}>7 dias</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset(30)}>30 dias</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset("month")}>Mês atual</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset("lastMonth")}>Mês passado</Button>
        </div>
        {onClearFilters && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={onClearFilters}>
            Desativar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
