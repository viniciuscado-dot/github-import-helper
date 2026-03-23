

## Plan: Make Material Type Selectors Functional

### Overview
Make the "Criativos", "Roteiros de Vídeo", and "Landing Page" selectors functional by: defaulting all 3 as selected, passing them to the Edge Function, and instructing the AI to generate only the selected material types.

### Changes

**1. `src/components/CopyForm.tsx`**
- Change default state from `[]` to `['criativos', 'roteiro_video', 'landing_page']`
- Pass `selectedMaterialTypes` in the body of all 3 `generate-copy-ai` invocations (lines ~413, ~992, ~2452)
- Add validation: at least 1 type must be selected before submitting

**2. `supabase/functions/generate-copy-ai/index.ts`**
- Read `materialTypes` from the request body
- Inject a section into the `userMessage` that tells the AI which material types to generate, e.g.:
  ```
  TIPOS DE MATERIAL SOLICITADOS: Criativos, Landing Page
  Gere APENAS os materiais dos tipos listados acima. NÃO gere materiais de tipos não solicitados.
  ```
- If no `materialTypes` provided, default to all 3 (backward compatibility)

### Technical Notes
- No database migration needed — `materialTypes` is passed as a runtime parameter to the Edge Function, not stored
- The filtering happens at the AI prompt level: the AI is instructed to only produce content for selected types
- Edge Function needs redeployment after changes

