

## Plan: Unify Prompts Across All Copy e Estratégia Phases

### What Changes
Currently, each phase (Onboarding, Mês Teste, Refinamento, Escala, Expansão) stores and loads its own set of prompts via `copy_type`. The user wants all 5 phases to share the same prompts.

### Approach
Use a single `copy_type` value (`'copy_estrategia'`) for all prompts in Copy e Estratégia, instead of using the phase-specific ID.

### Files to Modify

**1. `src/components/CopyForm.tsx`**
- In `fetchDefaultPrompts()`: change filter from `.eq('copy_type', mainTab)` to `.eq('copy_type', 'copy_estrategia')`
- In `handleCreatePrompt()`: change `copy_type: mainTab` to `copy_type: 'copy_estrategia'`
- In `fetchDefaultDocuments()` and `getDefaultDocumentsForBriefing()`: same change — use `'copy_estrategia'` instead of `mainTab`
- Keep `copy_type: mainTab` in the form submission (`onSubmit`) so the generated copy is still tagged to its phase for history filtering

**2. `supabase/functions/generate-copy-ai/index.ts`**
- Change prompt fetching from `.eq('copy_type', copyType)` to `.eq('copy_type', 'copy_estrategia')` so the Edge Function always uses the unified prompt set regardless of which phase triggered the generation

**3. Data migration consideration**
- Existing prompts in the database have `copy_type = 'onboarding'` (or other phase values). A one-time SQL update will migrate them:
  ```sql
  UPDATE default_prompts 
  SET copy_type = 'copy_estrategia' 
  WHERE copy_type IN ('onboarding', 'mes_teste', 'refinamento', 'escala', 'expansao') 
    AND is_active = true;
  ```

### What Stays the Same
- `copy_type` on `copy_forms` records still stores the phase for history filtering
- Análise e Bench prompts (`copy_type = 'analise_bench'`) are unaffected
- Prompt UI (create, edit, delete) works exactly the same — just shared across phases now

