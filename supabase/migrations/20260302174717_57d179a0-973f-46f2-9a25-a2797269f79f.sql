
-- 1) Tabela principal de briefings / formulários de copy
CREATE TABLE public.copy_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  copy_type TEXT NOT NULL DEFAULT 'onboarding',

  -- Dados do formulário
  nome_empresa TEXT,
  nicho_empresa TEXT,
  reuniao_boas_vindas TEXT,
  reuniao_kick_off TEXT,
  reuniao_brainstorm TEXT,
  tamanho_lp TEXT,
  servicos_produtos TEXT,
  diferencial_competitivo TEXT,
  publico_alvo TEXT,
  principal_inimigo TEXT,
  avatar_principal TEXT,
  momento_jornada TEXT,
  maior_objecao TEXT,
  cases_impressionantes TEXT,
  nomes_empresas TEXT,
  investimento_medio TEXT,
  pergunta_qualificatoria TEXT,
  informacao_extra TEXT,
  numeros_certificados TEXT,

  -- Documentos anexados
  document_files JSONB DEFAULT '[]'::jsonb,

  -- Resposta da IA
  ai_response TEXT,
  ai_provider TEXT,
  response_generated_at TIMESTAMPTZ
);

ALTER TABLE public.copy_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read copy_forms"
  ON public.copy_forms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert copy_forms"
  ON public.copy_forms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update own copy_forms"
  ON public.copy_forms FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any copy_forms"
  ON public.copy_forms FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete copy_forms"
  ON public.copy_forms FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete own copy_forms"
  ON public.copy_forms FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_copy_forms_updated_at
  BEFORE UPDATE ON public.copy_forms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) Tabela de labels customizáveis do formulário
CREATE TABLE public.briefing_form_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key TEXT NOT NULL UNIQUE,
  label_text TEXT,
  description_text TEXT,
  section_title TEXT,
  section_description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.briefing_form_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read labels"
  ON public.briefing_form_labels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage labels"
  ON public.briefing_form_labels FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE TRIGGER update_briefing_form_labels_updated_at
  BEFORE UPDATE ON public.briefing_form_labels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3) Tabela de documentos padrão para briefings
CREATE TABLE public.default_briefing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  copy_type TEXT NOT NULL DEFAULT 'onboarding',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.default_briefing_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read default docs"
  ON public.default_briefing_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage default docs"
  ON public.default_briefing_documents FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 4) Adicionar coluna created_by à tabela default_prompts (o código envia esse campo)
ALTER TABLE public.default_prompts ADD COLUMN IF NOT EXISTS created_by UUID;

-- 5) Criar bucket para documentos de briefing (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefing-documents', 'briefing-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload briefing docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'briefing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own briefing docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'briefing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can read all briefing docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'briefing-documents');
