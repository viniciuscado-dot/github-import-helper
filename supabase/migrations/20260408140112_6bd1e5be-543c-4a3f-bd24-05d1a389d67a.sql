
-- 1. test_copy_clients
CREATE TABLE public.test_copy_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  squad text NOT NULL DEFAULT 'Apollo',
  created_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.test_copy_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage test_copy_clients"
  ON public.test_copy_clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. test_copy_forms
CREATE TABLE public.test_copy_forms (LIKE public.copy_forms INCLUDING ALL);
ALTER TABLE public.test_copy_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage test_copy_forms"
  ON public.test_copy_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. test_copy_form_drafts
CREATE TABLE public.test_copy_form_drafts (LIKE public.copy_form_drafts INCLUDING ALL);
ALTER TABLE public.test_copy_form_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage test_copy_form_drafts"
  ON public.test_copy_form_drafts FOR ALL TO authenticated USING (true) WITH CHECK (true);
