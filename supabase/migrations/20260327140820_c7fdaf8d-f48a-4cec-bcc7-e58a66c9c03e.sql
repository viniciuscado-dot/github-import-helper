-- 1. Fix analise_bench_forms: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Authenticated users can read analise_bench_forms" ON public.analise_bench_forms;
CREATE POLICY "Authenticated users can read analise_bench_forms"
  ON public.analise_bench_forms FOR SELECT TO authenticated USING (true);

-- 2. Fix projects: restrict to authenticated
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
CREATE POLICY "Authenticated can select projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update projects" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- 3. Fix materials
DROP POLICY IF EXISTS "Allow all access to materials" ON public.materials;
CREATE POLICY "Authenticated can select materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update materials" ON public.materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete materials" ON public.materials FOR DELETE TO authenticated USING (true);

-- 4. Fix material_files
DROP POLICY IF EXISTS "Allow all access to material_files" ON public.material_files;
CREATE POLICY "Authenticated can select material_files" ON public.material_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert material_files" ON public.material_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update material_files" ON public.material_files FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete material_files" ON public.material_files FOR DELETE TO authenticated USING (true);

-- 5. Fix evaluations
DROP POLICY IF EXISTS "Allow all access to evaluations" ON public.evaluations;
CREATE POLICY "Authenticated can select evaluations" ON public.evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert evaluations" ON public.evaluations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update evaluations" ON public.evaluations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete evaluations" ON public.evaluations FOR DELETE TO authenticated USING (true);

-- 6. Fix kanban_status
DROP POLICY IF EXISTS "Allow all access to kanban_status" ON public.kanban_status;
CREATE POLICY "Authenticated can select kanban_status" ON public.kanban_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert kanban_status" ON public.kanban_status FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update kanban_status" ON public.kanban_status FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete kanban_status" ON public.kanban_status FOR DELETE TO authenticated USING (true);

-- 7. Fix kpis
DROP POLICY IF EXISTS "Allow all access to kpis" ON public.kpis;
CREATE POLICY "Authenticated can select kpis" ON public.kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert kpis" ON public.kpis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update kpis" ON public.kpis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete kpis" ON public.kpis FOR DELETE TO authenticated USING (true);

-- 8. Fix role escalation: prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id = auth.uid() THEN
    IF (OLD.role IS DISTINCT FROM NEW.role) OR
       (OLD.custom_role_id IS DISTINCT FROM NEW.custom_role_id) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
      IF get_user_role(auth.uid()) NOT IN ('admin', 'workspace_admin') THEN
        NEW.role := OLD.role;
        NEW.custom_role_id := OLD.custom_role_id;
        NEW.is_active := OLD.is_active;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();