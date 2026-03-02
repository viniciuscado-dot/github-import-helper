
CREATE TABLE public.default_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  copy_type TEXT NOT NULL DEFAULT 'onboarding',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.default_prompts ENABLE ROW LEVEL SECURITY;

-- Admins podem ver e gerenciar prompts
CREATE POLICY "Authenticated users can read active prompts"
  ON public.default_prompts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert prompts"
  ON public.default_prompts FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update prompts"
  ON public.default_prompts FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete prompts"
  ON public.default_prompts FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE TRIGGER update_default_prompts_updated_at
  BEFORE UPDATE ON public.default_prompts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
