

## Plan: Build Data-Driven Home + Gestao de Produtividade Module

### Overview
Transform the Data-Driven page from a "Coming Soon" placeholder into a module hub, and create a full productivity management page with upload, filters, and dashboard structure.

### Files to Create/Modify

**1. Modify `src/pages/DataDriven.tsx`**
- Remove `PageComingSoon` component
- Keep title and subtitle
- Add a grid of module cards (currently just one)
- Create a large clickable card "Gestao de Produtividade" with icon (`BarChart3` or `Activity`), title, subtitle, and hover effect
- Card links to `/data-driven/produtividade` via `useNavigate`

**2. Create `src/pages/DataDrivenProdutividade.tsx`**
New page with standard layout (AppSidebar, TopBar, SidebarProvider) containing:

- **Back button**: `ArrowLeft` icon + "Voltar" linking to `/data-driven`
- **Title/subtitle**: "Gestao de Produtividade" / "Dashboards e inteligencia sobre a produtividade do time."
- **Data upload block** (Card):
  - Textarea for instructions (label + placeholder as specified)
  - File upload area accepting `.xlsx, .xls, .csv` with drag-and-drop styling
  - "Atualizar dashboards" button (gradient variant)
- **Filters bar** (Card or inline):
  - Select dropdowns: Mes (Jan-Jun), Periodo, Squad, Colaborador
  - All static/mock for now
- **KPI cards row** (6 cards in responsive grid):
  - Horas totais lancadas, Media de horas por colaborador, Produtividade por squad, Entregas por periodo, Colaboradores com maior volume, Eficiencia media
  - Using mock numeric values
- **Charts section** (2x2 grid using recharts):
  - Bar chart: Horas por Squad
  - Line chart: Produtividade por Periodo
  - Bar chart: Horas por Colaborador
  - Area chart: Distribuicao de Horas
  - All with mock data, using existing `ChartContainer`/recharts patterns

**3. Modify `src/App.tsx`**
- Add lazy import for `DataDrivenProdutividade`
- Add protected route for `/data-driven/produtividade`

### Technical Details
- Reuse existing UI components: `Card`, `Button`, `Select`, `Textarea`, `Input`, `Label`
- Reuse recharts via the project's `ChartContainer`, `ChartTooltip` pattern from `src/components/ui/chart.tsx`
- KPI cards using a simple inline card structure (similar to `KPICard` component pattern)
- File upload uses a hidden `<input type="file" accept=".xlsx,.xls,.csv">` with a styled drop zone
- All data is static/mock -- no backend processing yet
- Standard layout wrapper: `max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6`

