

## Plan: Duplicate "Copy e Estratégia" as "Teste Copy"

### Overview
Create an independent copy of the entire Copy e Estratégia flow (client list page + copy form) under a new route, with its own database tables so changes don't affect the original.

### Database migrations

**1. `test_copy_clients` table** — clone of `copy_clients`
```sql
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
```

**2. `test_copy_forms` table** — clone of `copy_forms` structure
```sql
CREATE TABLE public.test_copy_forms (LIKE public.copy_forms INCLUDING ALL);
ALTER TABLE public.test_copy_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage test_copy_forms"
  ON public.test_copy_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**3. `test_copy_form_drafts` table** — clone of `copy_form_drafts`
```sql
CREATE TABLE public.test_copy_form_drafts (LIKE public.copy_form_drafts INCLUDING ALL);
ALTER TABLE public.test_copy_form_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage test_copy_form_drafts"
  ON public.test_copy_form_drafts FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### New files

**`src/pages/TestCopyEstrategia.tsx`**
- Full copy of `CopyEstrategia.tsx`, replacing:
  - Table references: `copy_clients` → `test_copy_clients`
  - Navigation: `/copy-estrategia` → `/teste-copy`
  - Client click route: `/dashboard?view=copy` → `/dashboard?view=teste-copy`
  - Sidebar `activeView`: `'copy'` → `'teste-copy'`

**`src/components/TestCopyForm.tsx`**
- Full copy of `CopyForm.tsx`, replacing:
  - Table references: `copy_forms` → `test_copy_forms`, `copy_form_drafts` → `test_copy_form_drafts`
  - Edge function call stays the same initially (or can be pointed to a test variant later)

### Modified files

**`src/components/app-sidebar.tsx`**
- Add entry above "Copy e Estratégia" in `criacaoSubmenu`:
```ts
{ id: 'teste-copy', title: 'Teste Copy', icon: FlaskConical, route: '/teste-copy' },
```

**`src/App.tsx`**
- Add lazy import for `TestCopyEstrategia`
- Add route `/teste-copy` inside `ProtectedRoute`

**`src/pages/Index.tsx`**
- Add `'teste-copy'` to `VALID_VIEWS` and `ActiveViewType`
- Add case in `renderContent()` to render `<TestCopyForm />`
- Add module mapping for permission check

### What stays unchanged
- Original `copy_clients`, `copy_forms`, `copy_form_drafts` tables and all their data
- Original `CopyEstrategia.tsx` and `CopyForm.tsx` — completely untouched
- Edge functions, RLS on original tables, all other pages

