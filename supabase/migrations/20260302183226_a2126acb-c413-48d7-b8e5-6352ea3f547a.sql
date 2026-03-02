
-- Create table for Análise e Bench briefings
CREATE TABLE public.analise_bench_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  client_id TEXT,
  nome_empresa TEXT,
  nicho_empresa TEXT,
  site TEXT,
  servicos_produtos TEXT,
  diferenciais_competitivos TEXT,
  publico_alvo TEXT,
  objetivo_projeto TEXT,
  maior_desafio TEXT,
  competitors JSONB DEFAULT '[]'::jsonb,
  objetivo_benchmark JSONB DEFAULT '[]'::jsonb,
  objetivo_benchmark_outro TEXT,
  aspecto_prioritario TEXT,
  informacoes_adicionais TEXT,
  ai_response TEXT,
  ai_provider TEXT,
  response_generated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analise_bench_forms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read analise_bench_forms"
  ON public.analise_bench_forms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own analise_bench_forms"
  ON public.analise_bench_forms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own analise_bench_forms"
  ON public.analise_bench_forms FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any analise_bench_forms"
  ON public.analise_bench_forms FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete own analise_bench_forms"
  ON public.analise_bench_forms FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete analise_bench_forms"
  ON public.analise_bench_forms FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

-- Trigger for updated_at
CREATE TRIGGER update_analise_bench_forms_updated_at
  BEFORE UPDATE ON public.analise_bench_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
