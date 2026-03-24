

## Plan: Persist Form Data Per Client + Phase

### Overview
Save form field values automatically so that when a user returns to the same client and phase (e.g., Sonora + Onboarding), the form is pre-filled with previously entered data. Each client/phase combination stores its own draft independently.

### Approach
Create a new Supabase table `copy_form_drafts` to store form field values keyed by `client_name` + `copy_type` (phase). The form auto-saves on field changes (debounced) and auto-loads when entering a client/phase.

### Changes

**1. Database migration — Create `copy_form_drafts` table**
```sql
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
```

**2. Modify `src/components/CopyForm.tsx`**
- **On mount / phase change**: query `copy_form_drafts` for matching `client_name` + `copy_type` (mainTab). If found, call `form.reset(data.form_data)` and restore `projectObjective` and `selectedPlatforms`.
- **Auto-save on change** (debounced ~1.5s): watch form values via `form.watch()`, upsert to `copy_form_drafts` with current form data, objective, and platforms. Use the `UNIQUE(client_name, copy_type)` constraint with `onConflict` for upsert.
- **Also save objective/platforms**: include `projectObjective` and `selectedPlatforms` in the draft so they persist too.
- After successful copy generation, do NOT clear the draft — keep it so the user can regenerate with same data.

### Technical Details
- Uses `jsonb` column to store all form fields flexibly without needing to mirror every column
- Upsert via `.upsert()` with `onConflict: 'client_name,copy_type'`
- Debounce implemented with `useEffect` + `setTimeout` to avoid excessive writes
- Draft loading happens in the existing `useEffect` that fires on `mainTab` change
- `projectObjective` and `selectedPlatforms` are stored alongside form data since they're also per-client/phase context

