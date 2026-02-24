import { useState, useEffect } from "react";
import { ArrowRight, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditQuickAccessModal, QuickAccessItem, ALL_QUICK_ACCESS_ITEMS } from "./EditQuickAccessModal";
import { supabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface QuickAccessSectionProps {
  onNavigate: (view: string) => void;
}

export function QuickAccessSection({ onNavigate }: QuickAccessSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<QuickAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadPreferences = async () => {
    if (!user) {
      // localStorage fallback
      const stored = localStorage.getItem("quick_access");
      setItems(stored ? JSON.parse(stored) : []);
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("user_preferences")
        .select("quick_access")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.quick_access) {
        setItems(data.quick_access as QuickAccessItem[]);
      }
    } catch {
      // fallback
      const stored = localStorage.getItem("quick_access");
      if (stored) setItems(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const handleSave = async (newItems: QuickAccessItem[]) => {
    setItems(newItems);
    localStorage.setItem("quick_access", JSON.stringify(newItems));
    if (!user) return;
    try {
      await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, quick_access: newItems },
          { onConflict: "user_id" }
        );
    } catch {
      // silent — localStorage already saved
    }
  };

  const handleCardClick = (item: QuickAccessItem) => {
    if (item.route.startsWith("/")) {
      navigate(item.route);
    } else {
      onNavigate(item.key);
    }
  };

  const iconForItem = (key: string) => {
    const found = ALL_QUICK_ACCESS_ITEMS.find((i) => i.key === key);
    return found?.Icon;
  };

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Acesso rápido</h2>
          <p className="text-xs text-muted-foreground">Escolha até 3 atalhos para aparecerem aqui.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" />
          Editar atalhos
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-card/50 p-8 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Escolher atalhos</span>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((item) => {
            const Icon = iconForItem(item.key);
            return (
              <button
                key={item.key}
                onClick={() => handleCardClick(item)}
                className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {Icon && <Icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      )}

      <EditQuickAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selected={items}
        onSave={handleSave}
      />
    </section>
  );
}
