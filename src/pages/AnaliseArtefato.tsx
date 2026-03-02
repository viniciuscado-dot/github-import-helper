import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/external-client";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Users, Target, Building2, TrendingUp } from "lucide-react";
import dotLogoDark from "@/assets/dot-logo-dark.png";

export default function AnaliseArtefato() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: row, error } = await supabase
        .from("analise_bench_forms")
        .select("*")
        .eq("share_token", token)
        .single();
      if (error || !row) {
        setNotFound(true);
      } else {
        setData(row);
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(221,54%,14%)]">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(221,54%,14%)] text-white gap-4">
        <h1 className="text-2xl font-bold">Análise não encontrada</h1>
        <p className="text-white/60">O link pode ter expirado ou ser inválido.</p>
      </div>
    );
  }

  const competitors: any[] = data.competitors || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(221,54%,10%)] via-[hsl(221,54%,14%)] to-[hsl(221,54%,18%)]">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <img src={dotLogoDark} alt="DOT Digital Group" className="h-8" />
          <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
            Relatório de Análise
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {data.nome_empresa || "Análise de Benchmarking"}
          </h1>
          {data.nicho_empresa && (
            <p className="text-white/50 text-lg">{data.nicho_empresa}</p>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: "Empresa", value: data.nome_empresa },
            { icon: Globe, label: "Site", value: data.site },
            { icon: Target, label: "Público-alvo", value: data.publico_alvo },
            { icon: TrendingUp, label: "Objetivo", value: data.objetivo_projeto },
          ]
            .filter((item) => item.value)
            .map((item, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="h-4 w-4 text-[hsl(0,75%,55%)]" />
                  <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                <p className="text-sm text-white/90 font-medium">{item.value}</p>
              </div>
            ))}
        </div>

        {/* Additional fields */}
        {(data.servicos_produtos || data.diferenciais_competitivos || data.maior_desafio) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Serviços/Produtos", value: data.servicos_produtos },
              { label: "Diferenciais Competitivos", value: data.diferenciais_competitivos },
              { label: "Maior Desafio", value: data.maior_desafio },
              { label: "Informações Adicionais", value: data.informacoes_adicionais },
            ]
              .filter((item) => item.value)
              .map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
                >
                  <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <p className="text-sm text-white/80 mt-1 whitespace-pre-wrap">{item.value}</p>
                </div>
              ))}
          </div>
        )}

        {/* Competitors */}
        {competitors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(0,75%,55%)]" />
              <h2 className="text-lg font-semibold text-white">Concorrentes Analisados</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitors.map((comp: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white text-sm">
                      {comp.nome || `Concorrente ${idx + 1}`}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        comp.tipo === "direto"
                          ? "border-[hsl(0,75%,55%)]/40 text-[hsl(0,75%,70%)] text-[10px]"
                          : "border-blue-500/40 text-blue-400 text-[10px]"
                      }
                    >
                      {comp.tipo === "direto" ? "Direto" : "Indireto"}
                    </Badge>
                  </div>
                  {comp.site && (
                    <p className="text-xs text-white/50 truncate">{comp.site}</p>
                  )}
                  {comp.porque_escolhido && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">
                      {comp.porque_escolhido}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {data.ai_response && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Análise Estratégica</h2>
            <div className="rounded-xl bg-white/[0.07] border border-white/10 p-6 sm:p-8 backdrop-blur-sm">
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-white prose-p:text-white/80
                prose-strong:text-white prose-li:text-white/80
                prose-table:text-white/80 prose-th:text-white
                prose-td:border-white/10 prose-th:border-white/20
              ">
                <MarkdownRenderer content={data.ai_response} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <img src={dotLogoDark} alt="DOT" className="h-6 opacity-50" />
          <p className="text-xs text-white/30">
            Relatório gerado pela plataforma DOT Digital Group
          </p>
        </div>
      </footer>
    </div>
  );
}
