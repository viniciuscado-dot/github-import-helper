

## What You Want

Two new features in the analysis detail popup:
1. **"Gerar Artefato" button** -- produces a shareable external link to a visual, interactive page showing the full analysis (company info, competitors, AI response) that can be sent to clients
2. **"Editar" option** -- allows editing the analysis content (ai_response) directly in the popup, with changes saved to Supabase and reflected in the artifact

## Is It Possible in the Current Flow?

Yes. The project already has the pattern for public external pages via token-based routes (see `AprovacaoCliente` at `/aprovacao-cliente/:token`). The `analise_bench_forms` table already has all the data needed. We just need to add a share token column and a public-facing page.

## Plan

### 1. Database Migration

Add a `share_token` column to `analise_bench_forms`:

```sql
ALTER TABLE public.analise_bench_forms
  ADD COLUMN share_token text UNIQUE DEFAULT gen_random_uuid()::text;

-- RLS policy for public access via token
CREATE POLICY "Public can read by share_token"
  ON public.analise_bench_forms
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);
```

### 2. New Public Page: `/analise/:token`

Create `src/pages/AnaliseArtefato.tsx` -- a standalone, unprotected page that:
- Fetches `analise_bench_forms` by `share_token` (using anon key, no auth required)
- Renders a polished, branded, interactive layout with:
  - Company header with logo/name/niche
  - Competitor cards with type badges
  - Full AI analysis rendered via `MarkdownRenderer`
  - Dot branding footer
- Responsive design, works on mobile
- No editing capabilities (read-only for clients)

### 3. Add Route in `App.tsx`

```
<Route path="/analise/:token" element={<AnaliseArtefato />} />
```

Public route (no `ProtectedRoute` wrapper), similar to `/aprovacao-cliente/:token`.

### 4. Update Popup in `AnaliseBench.tsx`

**"Gerar Link" button**: Copies the artifact URL (`/analise/{share_token}`) to clipboard. Shows a toast with the link. Uses the existing `share_token` from the briefing record.

**"Editar Análise" button**: Toggles the `ai_response` area into an editable `Textarea`. On save, updates `analise_bench_forms.ai_response` in Supabase. Changes are immediately reflected in the artifact since it reads from the same table.

### 5. Summary of Files

| Action | File |
|--------|------|
| Create | `supabase/migrations/xxx_add_share_token.sql` |
| Create | `src/pages/AnaliseArtefato.tsx` |
| Edit | `src/App.tsx` (add route) |
| Edit | `src/components/AnaliseBench.tsx` (add buttons to popup) |
| Edit | `src/integrations/supabase/types.ts` (add share_token field) |

