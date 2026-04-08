

## Plan: Persist Form Data After Copy Generation

### Problem
After generating a copy, `form.reset()` (line 443) wipes all form fields. The draft system (`copy_form_drafts`) also has incomplete data for some clients. When the user returns to the form, only reunion fields appear because the draft was either never fully saved or was overwritten by the reset.

### Root causes
1. **`form.reset()` on line 443** clears the form after successful generation
2. The reset triggers the auto-save watcher, which saves empty/partial data to `copy_form_drafts`, overwriting the complete draft
3. No mechanism loads the last submitted `copy_forms` data back into the form

### Solution

**Single file: `src/components/CopyForm.tsx`**

1. **Remove `form.reset()` after generation** (line 443) — keep the form populated so the user can edit and regenerate
2. **Remove `lastFormDataRef.current = null`** (line 445) — preserve the reference
3. **On initial load, if no draft exists, load the most recent `copy_forms` entry** for the current client — this ensures that even if the draft was lost, the last submitted briefing populates the form
4. **Keep `setUploadedDocuments([])`** — uploaded docs are already saved to the DB, clearing the upload list is fine

### Detail on change #3 (fallback load from `copy_forms`)
In the draft loading `useEffect` (lines 590-622), when `data` is null (no draft found), add a fallback query:
```ts
// If no draft, try loading from most recent copy_forms submission
const { data: lastSubmission } = await supabase
  .from('copy_forms')
  .select('*')
  .eq('nome_empresa', clientName)
  .eq('copy_type', mainTab)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

if (lastSubmission) {
  const formFields = { /* map all allowedFields from lastSubmission */ }
  form.reset(formFields)
}
```

### What stays unchanged
- Draft auto-save logic (debounced upsert)
- Form schema and validation
- Generation flow and edge function calls
- History/results tabs

### Files Modified
- `src/components/CopyForm.tsx`

