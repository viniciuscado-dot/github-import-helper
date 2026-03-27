

## Plan: Fix All Security Issues

The screenshot shows 4 errors and 3 warnings from the security scanner. Here's the fix for each.

### Issue 1: Business intelligence forms publicly readable (Error)
**Tables affected**: `analise_bench_forms` has a SELECT policy for `{public}` role with `USING (true)` — meaning unauthenticated (anon) users can read it.
**Fix**: Drop the public SELECT policy and ensure only `authenticated` users can read.

### Issue 2: KPI metrics fully readable and writable by unauthenticated users (Error)
**Tables affected**: `kpis`, `evaluations`, `kanban_status`, `materials`, `material_files`, `projects` — all have `FOR ALL` policies on `{public}` with `USING (true)`.
**Fix**: Drop overly permissive policies and replace with `TO authenticated` policies.

### Issue 3: Users can escalate their own role by updating their profile (Error)
**Table**: `profiles` — the "Users can update own profile" policy allows users to update ANY column including `role`.
**Fix**: Create a trigger that prevents non-admin users from changing their own `role`, `custom_role_id`, or `is_active` fields.

### Issue 4: User profiles with emails and phone numbers are publicly readable (Error)
**Table**: `profiles` — current SELECT policy is already `TO authenticated` with `USING (true)`, so this may be about anon access via other paths. Will ensure no anon SELECT policy exists.
**Fix**: Verify and ensure profiles SELECT is `authenticated` only (already the case from schema, but double-check no legacy policy remains).

### Issue 5: Leaked Password Protection Disabled (Warning)
**Fix**: This is a Supabase dashboard setting — I'll instruct the user to enable it. Cannot be done via migration.

### Issue 6: RLS Policy Always True (Warning)
**Fix**: Covered by issues 1 and 2 above — replace `USING (true)` ALL-access policies with authenticated-only policies.

### Issue 7: High severity vulnerabilities in application dependencies (Warning)
**Fix**: Run `npm audit fix` to update vulnerable packages.

---

### Database Migration (single SQL migration)

```sql
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
  -- If the user is updating their own profile
  IF NEW.id = auth.uid() THEN
    -- Prevent changing sensitive fields unless user is admin/workspace_admin
    IF (OLD.role IS DISTINCT FROM NEW.role) OR
       (OLD.custom_role_id IS DISTINCT FROM NEW.custom_role_id) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
      -- Check if caller is admin
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
```

### Manual Step (user action required)
- **Leaked Password Protection**: Go to Supabase Dashboard → Authentication → Providers → Email → enable "Leaked Password Protection (HIBP)". I'll provide the link.

### No Code Changes Needed
The frontend already uses authenticated Supabase calls, so restricting policies to `authenticated` won't break anything. The trigger silently prevents role escalation without changing any UI.

