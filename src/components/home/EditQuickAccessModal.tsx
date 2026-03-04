import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Copy, CheckCircle, BarChart2, CalendarDays, Search, Newspaper,
  Video, Lightbulb, Layout, Eye, type LucideIcon
} from "lucide-react";

export interface QuickAccessItem {
  key: string;
  label: string;
  description: string;
  route: string;
  Icon?: LucideIcon;
}

export const ALL_QUICK_ACCESS_ITEMS: (QuickAccessItem & { Icon: LucideIcon })[] = [
  { key: "copy", label: "Copy e Estratégia", description: "Criação e gestão de textos", route: "/copy-estrategia", Icon: Copy },
  { key: "aprovacao", label: "Aprovação", description: "Envios, ajustes e aprovações", route: "/aprovacao", Icon: CheckCircle },
  { key: "analise-bench", label: "Análise e Bench", description: "Análises e benchmarks", route: "/analise-bench", Icon: BarChart2 },
  { key: "planejamento-conteudo", label: "Planejamento de Conteúdo", description: "Calendário e planejamento", route: "/social-media/planejamento", Icon: CalendarDays },
  { key: "varredura", label: "Varredura", description: "Monitoramento social", route: "/social-media/varredura", Icon: Search },
  { key: "central-posts", label: "Central de Posts", description: "Gestão de posts sociais", route: "/social-media/central-posts", Icon: Newspaper },
  { key: "editor-video", label: "Editor de Vídeo", description: "Edição e testes criativos", route: "/laboratorio/editor-video", Icon: Video },
  { key: "banco-ideias", label: "Banco de Ideias", description: "Estruturas e criativos validados", route: "/laboratorio/banco-ideias", Icon: Lightbulb },
  { key: "lp-builder", label: "LP Builder", description: "Construtor de landing pages", route: "/laboratorio/lp-builder", Icon: Layout },
  { key: "diagnostico-visual", label: "Diagnóstico Visual", description: "Avaliação técnica de criativos", route: "/laboratorio/diagnostico-visual", Icon: Eye },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: QuickAccessItem[];
  onSave: (items: QuickAccessItem[]) => void;
}

export function EditQuickAccessModal({ open, onOpenChange, selected, onSave }: Props) {
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDraft(selected.map((s) => s.key));
    }
  }, [open, selected]);

  const toggle = (key: string) => {
    setDraft((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const handleSave = () => {
    const items: QuickAccessItem[] = draft.map((key) => {
      const found = ALL_QUICK_ACCESS_ITEMS.find((i) => i.key === key)!;
      return { key: found.key, label: found.label, description: found.description, route: found.route };
    });
    onSave(items);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar atalhos rápidos</DialogTitle>
          <DialogDescription>Selecione até 3 menus para fixar na sua Home.</DialogDescription>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-2 font-medium">
          {draft.length}/3 selecionados
        </div>

        <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
          {ALL_QUICK_ACCESS_ITEMS.map((item) => {
            const checked = draft.includes(item.key);
            const disabled = !checked && draft.length >= 3;
            const orderIdx = draft.indexOf(item.key);

            return (
              <div
                key={item.key}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  checked ? "border-primary/40 bg-primary/5" : "border-border/40"
                } ${disabled ? "opacity-50" : ""}`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggle(item.key)}
                />
                <item.Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                {checked && (
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={orderIdx === 0}
                      onClick={() => move(orderIdx, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={orderIdx === draft.length - 1}
                      onClick={() => move(orderIdx, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
