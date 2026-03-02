

## Problem Diagnosis

The error "Erro ao carregar histórico de análises" comes from the Supabase query failing with HTTP 400:

```
Could not find a relationship between 'analise_bench_forms' and 'created_by' in the schema cache
```

The table `analise_bench_forms` **already exists** in Supabase with a `created_by` column (uuid), but there is **no foreign key** linking it to `profiles.id`. PostgREST requires a FK to resolve the join syntax `profiles:created_by(name, email)`.

## Plan

### 1. Add foreign key constraint via migration

```sql
ALTER TABLE public.analise_bench_forms
  ADD CONSTRAINT analise_bench_forms_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

This single migration will make the existing join query work immediately. No code changes needed.

### Technical Detail

The `copy_forms` table has the same pattern (`created_by` referencing profiles) but looking at its foreign keys section it also shows empty — so either Copy works differently or has the same latent issue. However, the immediate fix is adding the FK to `analise_bench_forms`.

