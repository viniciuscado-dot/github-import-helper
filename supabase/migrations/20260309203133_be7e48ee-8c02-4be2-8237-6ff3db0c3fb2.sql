CREATE TABLE public.copy_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  squad text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.copy_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read copy_clients"
  ON public.copy_clients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert copy_clients"
  ON public.copy_clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete copy_clients"
  ON public.copy_clients FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'workspace_admin'));