

## Analysis

This is a very large-scale migration request. The codebase currently runs entirely on mock data (localStorage + in-memory arrays). There are **76+ files** importing from `external-client.ts` (which points to a mock Supabase client), and the entire approval module (12+ files) uses `approvalDataService.ts` (1300 lines of localStorage-based logic).

The database has **zero tables** currently. We need to create them first, then rewrite the data layer.

### Key Constraint
The user has declined the database migration tool twice. This means I need to provide the SQL for the user to run manually via the Supabase SQL Editor, while I handle all the code changes.

---

## Plan

### Phase 1: Database Schema (User runs SQL manually)

The user will need to run the following SQL in the Supabase SQL Editor to create all required tables. I will provide the complete SQL script as a file (`supabase/schema.sql`) for reference, covering:

**Tables to create:**
- `projects` (id, name, description, type, external_reference_id, created_at)
- `materials` (id, project_id FK, version_number, status, is_active_version, created_at)
- `material_files` (id, material_id FK, file_url, file_type, created_at)
- `evaluations` (id, material_id FK, version_number, copy_score, design_score, feedback_copy, feedback_design, is_official, created_at)
- `kanban_status` (id, material_id FK, column_status, updated_at)
- `kpis` (id, project_id FK, metric_name, metric_value, period, created_at)

**Storage:**
- `material-files` bucket (public)

**RLS:**
- All tables: RLS enabled but with permissive policies (since there is no auth, all authenticated operations use anon key with open access)

**No auth, no users, no clients** -- as specified.

### Phase 2: Update Supabase Client Configuration

**File: `src/integrations/supabase/external-client.ts`**
- Remove mock client import entirely
- Import and re-export the real Supabase client from `@/integrations/supabase/client`

**File: `src/config/featureFlags.ts`**
- Set `SUPABASE_ENABLED: true`

### Phase 3: Rewrite `approvalDataService.ts`

This is the core of the migration. The entire 1300-line file currently uses localStorage. It will be rewritten to use Supabase queries against the new tables:

- `getJobs()` → `supabase.from('projects').select()`
- `createJob()` → `supabase.from('projects').insert()` + `supabase.from('materials').insert()` + `supabase.from('kanban_status').insert()`
- `updateJob()` → `supabase.from('projects').update()` + `supabase.from('materials').update()`
- `deleteJob()` → `supabase.from('projects').delete()`
- `submitClientFeedback()` → `supabase.from('evaluations').insert()`
- `getClientFeedback()` → `supabase.from('evaluations').select()`
- `computeKPIs()` → query from `projects` + `evaluations` + `kanban_status`
- `computeSquadRanking()` / `computeUnifiedRanking()` → query-based
- All localStorage keys (`STORAGE_KEY`, `FEEDBACK_STORAGE_KEY`, `VERSIONS_STORAGE_KEY`, etc.) removed
- File uploads in `JobDialog` → `supabase.storage.from('material-files').upload()`

All exported interfaces (`ApprovalJobData`, `ApprovalVersion`, `ApprovalClientFeedback`, etc.) will be preserved to maintain compatibility with the 12+ consumer files.

### Phase 4: Update AuthContext (Remove Mock Dependency)

**File: `src/contexts/AuthContext.tsx`**
- Remove import of `MOCK_AUTH_USER` from mockData
- Keep the existing login/profile system as-is (hardcoded profiles without Supabase Auth, per user's instruction to NOT implement auth)
- Remove dependency on mock IDs for data operations

### Phase 5: Remove Mock Files

- Delete `src/mocks/mockData.ts`
- Delete `src/mocks/mockSupabaseClient.ts`
- Update all 76+ files that import from `external-client.ts` -- these already use `supabase.from()` syntax via the mock client, so they should work with the real client with minimal changes (the mock client was designed to mirror the real API)

### Phase 6: Verify Consumer Components

The following components import from `approvalDataService` and will need interface compatibility verified:
- `ApprovalKanban.tsx`, `ApprovalKanbanView.tsx`
- `ApprovalDashboard.tsx`
- `ApprovalListView.tsx`
- `ApprovalColumn.tsx`, `ApprovalJobCard.tsx`
- `JobDialog.tsx`
- `MaterialPreviewDialog.tsx`
- `HistoryTimeline.tsx`
- `AprovacaoCliente.tsx`
- `Aprovacao.tsx`
- `SquadRankingTable.tsx`

All functions will become `async` (returning Promises), so all call sites will need `await` added.

---

### Technical Details

**Data model mapping (current mock → Supabase):**

```text
Current "job" (localStorage)     →  projects + materials + kanban_status
Current "version" (localStorage) →  materials (version_number)
Current "asset" (localStorage)   →  material_files
Current "feedback" (localStorage)→  evaluations
Current "creative states"        →  Derived from evaluations + materials
Current "sent versions"          →  materials where status != 'draft'
```

**Risk: Breaking change magnitude**
- ~76 files use `supabase` from external-client (will work after swap since API is identical)
- ~12 files use `approvalDataService` (need async conversion)
- AuthContext keeps mock profiles (no auth change)
- All other components (CRM/CSM/Kanban/Cancellation) already use `supabase.from()` via external-client -- they'll automatically work with the real client

**Execution order:**
1. User creates tables via SQL Editor
2. Create storage bucket via SQL
3. Swap external-client to real client
4. Rewrite approvalDataService to async Supabase queries
5. Update all consumer components to use async calls
6. Remove mock files
7. Update feature flags

