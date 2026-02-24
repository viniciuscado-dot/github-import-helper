import { CheckCircle, Copy, BarChart2, ArrowRight } from "lucide-react";

interface HomeCriacaoProps {
  onNavigate: (view: string) => void;
}

const modules = [
  {
    id: "copy",
    title: "Copy",
    description: "Criação e gestão de textos",
    icon: Copy,
    view: "copy",
  },
  {
    id: "aprovacao",
    title: "Aprovação",
    description: "Gerencie envios, ajustes e aprovações de materiais",
    icon: CheckCircle,
    route: "/aprovacao",
  },
  {
    id: "analise-bench",
    title: "Análise e Bench",
    description: "Análises, benchmarks e insights",
    icon: BarChart2,
    view: "analise-bench",
  },
];

export function HomeCriacao({ onNavigate }: HomeCriacaoProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
        Bem-vindo ao módulo de criação!
      </h1>
      <p className="text-sm text-muted-foreground mb-10 text-center">
        Selecione uma área para começar
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => {
              if (mod.route) {
                onNavigate(mod.id);
              } else if (mod.view) {
                onNavigate(mod.view);
              }
            }}
            className="group relative flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card p-6 text-left transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <mod.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{mod.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {mod.description}
              </p>
            </div>
            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
