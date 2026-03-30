

## Plan: Unify All Client Selectors to Use `copy_clients` Table

### Problem
Client lists come from 3 different sources:
1. **`copy_clients` table** — used by "Copy e Estratégia" and "Análise e Bench" selection pages (the real managed list)
2. **`MOCK_CLIENTS` hardcoded array** — used in `JobDialog.tsx` (Aprovação) as fallback
3. **`crm_cards` / `crm_pipelines`** — used in `JobDialog.tsx` and `AnaliseBench.tsx` form
4. **`projects.client_name`** — used by `getUniqueClients()` in `approvalDataService.ts` for the Aprovação filter

### Solution
Make `copy_clients` the **single source of truth**. All client selectors will query `copy_clients` (active, non-archived). Remove `MOCK_CLIENTS` and CRM-based client fetching.

### Changes

**1. Create shared utility `src/utils/getClients.ts`**
- Export `fetchCopyClients(): Promise<{ value: string; label: string; squad: string }[]>` that queries `copy_clients` where `is_archived = false`, returns sorted list.
- Export `fetchCopyClientNames(): Promise<string[]>` convenience wrapper returning just names.

**2. `src/components/approval/JobDialog.tsx`**
- Remove `MOCK_CLIENTS` array (lines 48-59)
- Replace `loadActiveClients()` (lines 220-259) with call to `fetchCopyClientNames()`
- Remove CRM pipeline/cards/lost-clients logic entirely

**3. `src/components/AnaliseBench.tsx`**
- Replace `fetchCRMClients()` (lines 144-165) with `fetchCopyClients()`
- Update the client selector dropdown to use `name` instead of `company_name`/`id`

**4. `src/services/approvalDataService.ts`**
- Update `getUniqueClients()` (line 276-279) to query `copy_clients` instead of `projects.client_name`

**5. `src/pages/Aprovacao.tsx`**
- No change needed — it already calls `getUniqueClients()` which will be updated

### What stays unchanged
- `copy_clients` table schema, RLS, CRUD in CopyEstrategia and AnaliseBenchSelecao
- All other approval logic, filters, navigation
- No database migrations needed

### Files Modified
- `src/utils/getClients.ts` — new shared utility
- `src/components/approval/JobDialog.tsx` — use shared utility, remove MOCK_CLIENTS
- `src/components/AnaliseBench.tsx` — use shared utility instead of CRM
- `src/services/approvalDataService.ts` — update `getUniqueClients()`

