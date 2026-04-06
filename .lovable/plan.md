

## Plan: Fix Missing Form Fields Not Being Saved

### Problem
Two form fields are not being persisted:
1. **`tamanho_lp`** — exists in the DB but is missing from the `allowedFields` whitelist in the insert logic (line 389-395), so it gets silently dropped.
2. **`site`** — defined in the form schema and rendered in the UI, but the column does **not exist** in the `copy_forms` table at all.

### Changes

**1. Database migration — add `site` column**
```sql
ALTER TABLE public.copy_forms ADD COLUMN site text;
```

**2. `src/components/CopyForm.tsx` — add missing fields to `allowedFields`**
Update the `allowedFields` array (line 389-395) to include `'tamanho_lp'` and `'site'`:
```ts
const allowedFields = [
  'reuniao_boas_vindas','reuniao_kick_off','reuniao_brainstorm',
  'tamanho_lp','site',
  'servicos_produtos','diferencial_competitivo','publico_alvo','principal_inimigo',
  'avatar_principal','momento_jornada','maior_objecao','cases_impressionantes',
  'nomes_empresas','investimento_medio','pergunta_qualificatoria','informacao_extra',
  'numeros_certificados','nome_empresa','nicho_empresa'
] as const
```

### What stays unchanged
- Form UI, validation schema, draft system, AI generation logic
- All other tables and RLS policies

### Files Modified
- Database migration (add `site` column to `copy_forms`)
- `src/components/CopyForm.tsx` (add 2 fields to `allowedFields`)

