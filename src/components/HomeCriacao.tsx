import { QuickAccessSection } from "@/components/home/QuickAccessSection";
import { NewsFeed } from "@/components/home/NewsFeed";

interface HomeCriacaoProps {
  onNavigate: (view: string) => void;
}

export function HomeCriacao({ onNavigate }: HomeCriacaoProps) {
  return (
    <div className="flex flex-col items-center px-4 py-2 w-full max-w-4xl mx-auto space-y-8">
      {/* Boas-vindas */}
      <div className="text-center pt-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Bem-vindo ao módulo de criação!
        </h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma área para começar
        </p>
      </div>

      {/* Acesso rápido */}
      <QuickAccessSection onNavigate={onNavigate} />

      {/* Notícias */}
      <NewsFeed />
    </div>
  );
}
