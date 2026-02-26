

## Plano: Remover 15 telas ocultas e código órfão

### Resumo

Existem **3 categorias** de código a remover:

1. **Rotas em `App.tsx`** que não têm link no sidebar
2. **Views em `Index.tsx`** (query param `?view=`) sem menu correspondente
3. **Componentes e utilitários** que ficam órfãos após a remoção acima

---

### O que será removido

**Páginas (arquivos a deletar):**
- `src/pages/SolicitacaoCancelamento.tsx`
- `src/pages/GestaoCancelamentos.tsx`
- `src/pages/FormCSAT.tsx`
- `src/pages/FormNPS.tsx`
- `src/pages/GestaoNPS.tsx`
- `src/pages/GestaoCSAT.tsx`
- `src/pages/CasesSuccesso.tsx`
- `src/pages/CasesRouter.tsx`
- `src/pages/CaseDetail.tsx`
- `src/pages/CasesBlog.tsx`
- `src/pages/GerarForms.tsx`

**Componentes órfãos (pastas inteiras a deletar):**
- `src/components/cancellation/` (6 arquivos — usados apenas por GestaoCancelamentos)
- `src/components/kanban/` (~25 arquivos — usados apenas pelo CSMKanban)
- `src/components/csm/` (3 arquivos — usados apenas pelo CSMKanban)
- `src/components/crm/` (4 arquivos — usados apenas por kanban/CardDetailsDialog)
- `src/components/cases/` (2 arquivos — usados apenas por CasesSuccesso)
- `src/components/charts/` (4 arquivos — usados apenas por CS dashboards)

**Componentes individuais a deletar:**
- `src/components/CSMKanban.tsx`
- `src/components/CSMClientsList.tsx`
- `src/components/CustomerSuccessDashboard.tsx`
- `src/components/CSATMetricsDashboard.tsx`
- `src/components/FinancialMetrics.tsx`
- `src/components/ChurnMetrics.tsx`
- `src/components/GestaoProjetosOperacao.tsx`
- `src/components/GestaoContratos.tsx`
- `src/components/SquadManager.tsx`
- `src/components/CelebrationManagement.tsx`
- `src/components/CelebrationSelector.tsx`
- `src/components/CelebrationAnimation.tsx`
- `src/components/PublicPageWithSidebar.tsx`
- `src/components/FixItabanDuplicate.tsx`
- `src/components/DateMonthPicker.tsx`
- `src/components/MonthYearPicker.tsx`
- `src/components/SecurityAuditLogs.tsx`
- `src/components/RoleManagement.tsx`

**Utilitários órfãos a deletar:**
- `src/utils/findCSMCard.ts`
- `src/utils/syncCSMClients.ts`
- `src/utils/csmKanbanSessionCache.ts`
- `src/utils/importClients.ts`
- `src/utils/importNPSData.ts`
- `src/utils/updateCategorias.ts`

**Hooks órfãos a deletar:**
- `src/hooks/useAutoMoveCards.tsx`
- `src/hooks/useCardTasks.tsx`
- `src/hooks/useChurnStageValidation.tsx`
- `src/hooks/usePipelineAutomations.tsx`

---

### O que será editado

**`src/App.tsx`** — Remover:
- Imports de: SolicitacaoCancelamento, GestaoCancelamentos, FormCSAT, FormNPS, GestaoNPS, GestaoCSAT, CasesSuccesso, CasesRouter, GerarForms, PublicPageWithSidebar
- ~12 rotas (linhas 82-141): cancelamento, CSAT/NPS, gerar-forms, cases

**`src/pages/Index.tsx`** — Remover:
- Imports de: CSMKanban, GestaoProjetosOperacao, GestaoContratos, CustomerSuccessDashboard, CSATMetricsDashboard, FinancialMetrics, ChurnMetrics, RoleManagement, `updateCategorias`
- Views do `ActiveViewType`: csm, gestao-projetos, gestao-contratos, cs, cs-churn, cs-metricas, cs-nps, cs-csat, projetos-operacao, projetos-clientes, projetos-metricas, performance, gestao-nps, gestao-csat, cs-cancelamento, gestao-cancelamentos
- Cases correspondentes no `switch(activeView)` e nos `moduleMap`s
- Referências a `cs-cancelamento` e `gestao-cancelamentos` no `handleViewChange`

**`src/components/app-sidebar.tsx`** — Remover:
- Variáveis mortas: `csmItem`, `csFormulariosSubmenuBase`, `csGestaoSubmenuBase`, `csMetricasSubmenuBase`, `projetosSubmenuBase`, `csItems`, `operacaoItems`, `casesSuccessoItem`
- Estados e effects: `openCSFormularios`, `openCSGestao`, `openCSMetricas`, `openProjetos`, e respectivos `useEffect`
- Variáveis de detecção: `isCSFormulariosActive`, `isCSGestaoActive`, `isCSMetricasActive`, `isProjetosActive`
- Imports de ícones não usados

**`src/components/CommandPalette.tsx`** — Remover páginas órfãs da lista `pages[]` (dashboard, crm, csm, lista-espera, wallet, cs-churn, cs-metricas, cs-nps, projetos-operacao, performance)

**`src/components/app-sidebar.tsx` tipos** — Limpar `AppSidebarProps.activeView` removendo valores mortos (csm, cs, cs-churn, etc.)

---

### O que NÃO será alterado
- `/aprovacao` e `/aprovacao-cliente/:token` (funcional no sidebar)
- Sidebar, header, auth, rotas de laboratório e social media
- Home, Copy, Análise e Bench
- Edge functions (podem ficar — não afetam frontend)

