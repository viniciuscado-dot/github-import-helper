

## Plan: Add "Gestão de Entregas" Card to Data-Driven Hub

### Changes

**1. Create placeholder page `src/pages/DataDrivenEntregas.tsx`**
- Same layout pattern as `DataDrivenProdutividade.tsx` (sidebar, TopBar, back button to `/data-driven`)
- Title: "Gestão de Entregas", subtitle about delivery tracking
- `PageComingSoon` component as content (module in development)

**2. Add route in `src/App.tsx`**
- Lazy import `DataDrivenEntregas`
- Route: `/data-driven/entregas` inside `ProtectedRoute`

**3. Add card to `src/pages/DataDriven.tsx`**
- New entry in the `modules` array:
  - `id: "entregas"`, `title: "Gestão de Entregas"`, `subtitle: "Acompanhamento de entregas, prazos e status por cliente e squad"`, `icon: Package` (from lucide-react), `route: "/data-driven/entregas"`

### Files Modified
- `src/pages/DataDriven.tsx` — add module entry + import `Package`
- `src/pages/DataDrivenEntregas.tsx` — new page
- `src/App.tsx` — new lazy route

