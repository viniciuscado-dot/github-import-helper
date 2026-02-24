import { QuickAccessSection } from "@/components/home/QuickAccessSection";
import { NewsFeed } from "@/components/home/NewsFeed";

interface HomeCriacaoProps {
  onNavigate: (view: string) => void;
}

export function HomeCriacao({ onNavigate }: HomeCriacaoProps) {
  return (
    <div className="relative flex flex-col items-center px-4 py-2 w-full max-w-4xl mx-auto space-y-8">
      {/* Radial gradient background — Home only */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 15% 10%, hsl(var(--primary) / 0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 85% 15%, hsl(var(--primary) / 0.05) 0%, transparent 70%)",
        }}
      />

      {/* Boas-vindas */}
      <div className="relative z-10 text-center pt-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Bem-vindo ao módulo de criação!
        </h1>
        <p className="text-sm text-muted-foreground/70">
          Selecione uma área para começar
        </p>
      </div>

      {/* Acesso rápido */}
      <div className="relative z-10 w-full">
        <QuickAccessSection onNavigate={onNavigate} />
      </div>

      {/* Tendências e Notícias */}
      <div className="relative z-10 w-full">
        <NewsFeed />
      </div>
    </div>
  );
}
