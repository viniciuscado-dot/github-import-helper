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

const glassSection =
  "rounded-2xl border border-border/10 bg-card/[0.04] backdrop-blur-xl shadow-sm";
const glassCard =
  "rounded-xl border border-border/10 bg-card/[0.06] backdrop-blur-lg transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5";

export function QuickAccessSection({ onNavigate }: QuickAccessSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<QuickAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadPreferences = async () => {
    if (!user) {
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
      const stored = localStorage.getItem("quick_access");
      if (stored) setItems(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

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
      // silent
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
    <section className={`w-full p-5 ${glassSection}`}>
      <div className="flex items-center justify-between mb-4">
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
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/30 bg-card/[0.03] backdrop-blur-lg p-8 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Escolher atalhos</span>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((item, idx) => {
            const Icon = iconForItem(item.key);
            return (
              <button
                key={item.key}
                onClick={() => handleCardClick(item)}
                className={`group relative flex items-center gap-3 p-4 text-left ${glassCard}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.35s ease ${idx * 0.08}s, transform 0.35s ease ${idx * 0.08}s`,
                }}
              >
                {/* Icon badge with glass + glow */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm text-primary shadow-sm shadow-primary/10">
                  {Icon && <Icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
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
