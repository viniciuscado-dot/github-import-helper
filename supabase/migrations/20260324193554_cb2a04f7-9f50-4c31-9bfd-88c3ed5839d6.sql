CREATE TABLE public.copy_form_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  copy_type text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  project_objective text DEFAULT '',
  selected_platforms text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (client_name, copy_type)
);

ALTER TABLE public.copy_form_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage drafts"
  ON public.copy_form_drafts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);