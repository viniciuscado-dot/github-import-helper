

## Plan: Add Client on Copy e Estratégia page

### What will be built

1. **New Supabase table `copy_clients`** to persist clients with fields: `id`, `name`, `squad`, `created_at`, `created_by`. RLS policies for authenticated users.

2. **"Adicionar Cliente" button** in the page header, positioned to the right of the title "Copy e Estratégia", vertically aligned with the "Data fim" filter column on the right edge.

3. **Dialog popup** with two fields: client name (text input) and squad (select: Apollo, Athena, Ares, Artemis). On submit, inserts into `copy_clients` table.

4. **Refactor data source** in `CopyEstrategia.tsx`: replace `MOCK_CLIENTS` with data fetched from `copy_clients` table on mount. The `entryDate` will be derived from `created_at`.

### Layout positioning

```text
┌─────────────────────────────────────────────────────┐
│ ← Voltar                                            │
│ Copy e Estratégia              [+ Adicionar Cliente] │
│ Selecione o cliente/projeto...                      │
├─────────────────────────────────────────────────────┤
│ [Buscar...] [Squad ▼] [Data início] [Data fim]      │
├─────────────────────────────────────────────────────┤
│ Cards grid...                                       │
└─────────────────────────────────────────────────────┘
```

The button sits in the same row as the h1 title, aligned to the right.

### Database migration

```sql
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
```

### Code changes

**`src/pages/CopyEstrategia.tsx`**:
- Remove `MOCK_CLIENTS` constant
- Add state for dialog open, new client name/squad, loading
- Fetch clients from `supabase.from('copy_clients').select('*').order('created_at', { ascending: false })` on mount
- Add `handleAddClient` that inserts into `copy_clients` and refreshes the list
- Add Dialog with form (name input + squad select + submit button)
- Add "+ Adicionar Cliente" button in the header row, right-aligned
- Map `created_at` to display date format `dd/MM/yyyy`

No other files will be edited.

