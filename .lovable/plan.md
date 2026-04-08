

## Plan: Transform "Teste Copy" Form into Briefing PDF Analyzer

### Overview
Replace the entire form tab in the Teste Copy module with a simplified briefing analyzer: a PDF upload area, a text field for additional info, and a generate button. Keep everything else (objective, platforms, timeline, material type selector, Resultados, Prompts tabs) untouched.

### Changes

**1. Create `src/components/TestCopyBriefingForm.tsx` (new file)**
A standalone component that replaces `TestCopyForm`. It will:
- Reuse the same header structure from `CopyForm` (objective, platforms, timeline, material type selector)
- Rename the first tab from "Formulário" to "Briefing"
- Replace all form fields with:
  - **PDF upload area** — drag-and-drop or click-to-upload zone for a single PDF document (with file name display and remove button)
  - **"Informações adicionais" textarea** — free text field below the upload
  - **"Gerar Materiais" button** — triggers generation using the same edge function flow
- Keep Resultados and Prompts tabs intact (reuse `CopyResultsRecent`, `CopyDetailDialog`, `CopyHistoryFull`, and prompts logic from `CopyForm`)
- Use `test_copy_forms` and `test_copy_form_drafts` tables for persistence
- On submit: upload PDF to `briefing-documents` bucket, save reference + additional text to `test_copy_forms`, invoke `generate-copy-ai` edge function

**2. Update `src/pages/Index.tsx`**
- Change the `teste-copy` view case to render `<TestCopyBriefingForm>` instead of `<TestCopyForm>`

**3. Update `src/components/app-sidebar.tsx`**
- No changes needed (already shows "Teste Copy")

**4. Remove `src/components/TestCopyForm.tsx`**
- No longer needed since the new component replaces it entirely

### What stays unchanged
- Original `CopyForm.tsx` — completely untouched
- `TestCopyEstrategia.tsx` (client list page)
- All database tables, edge functions, RLS
- Timeline (Onboarding → Expansão), objective field, platform selector
- Material type selector (Criativos, Roteiros de Vídeo, Landing Page)
- Resultados and Prompts tabs functionality

### Technical details
- The new component will be ~600-800 lines (much smaller than `CopyForm`'s 2800) since most form fields are removed
- PDF upload uses the existing `briefing-documents` Supabase Storage bucket
- The `informacao_extra` field maps to the existing column in `test_copy_forms`
- The edge function receives `copyFormId` and `materialTypes` as before — the PDF content is extracted server-side by the existing `generate-copy-ai` logic

### Files
- **New**: `src/components/TestCopyBriefingForm.tsx`
- **Modified**: `src/pages/Index.tsx`
- **Removed**: `src/components/TestCopyForm.tsx`

