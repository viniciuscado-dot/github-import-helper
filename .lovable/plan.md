

## Plan: Create "Copy e Estratégia" Client Selection Page

### Overview
Create a new `/copy-estrategia` route with a client selection page that acts as an intermediary before the Copy Generator. The sidebar "Copy" item becomes "Copy e Estratégia" and navigates to this new page instead of opening the generator directly.

### Changes

**1. New page: `src/pages/CopyEstrategia.tsx`**
- Full sidebar layout (SidebarProvider + AppSidebar + SidebarInset + TopBar) matching Aprovacao.tsx pattern
- "Voltar" button (ArrowLeft icon) at top — uses `navigate(-1)` or falls back to `/dashboard`
- Title: "Copy e Estratégia", subtitle: "Selecione o cliente/projeto para iniciar a geração estratégica de copy."
- Filter bar: search input, squad dropdown (Apollo/Athena/Ares/Artemis), date period dropdown (7d/30d/90d/custom)
- Responsive grid of client cards (4 cols desktop, 2 tablet, 1 mobile)
- Each card: client name, "Entrou na DOT em DD/MM/YYYY", colored squad badge
- Hover: elevation + border highlight
- Click: navigates to `/dashboard?view=copy&client=<clientName>` (or passes state)
- 8 mock clients as specified

**2. Update `src/components/app-sidebar.tsx`**
- Rename "Copy" to "Copy e Estratégia" in `criacaoSubmenu`
- Change from view-based navigation to route-based: add `route: '/copy-estrategia'` and remove `view: 'copy'`

**3. Update `src/App.tsx`**
- Add lazy import for `CopyEstrategia`
- Add protected route: `/copy-estrategia`

**4. Update `src/components/CopyForm.tsx`** (minimal)
- Accept optional `clientName` prop
- Add "Voltar para Copy e Estratégia" button at top that navigates to `/copy-estrategia`
- Pre-fill `nome_empresa` if clientName is provided

**5. Update `src/pages/Index.tsx`**
- Pass client info from URL params to CopyForm when `view=copy`
- Handle the `client` search param

### Mock Data (inline in CopyEstrategia.tsx)
```
Construlima — 05/01/2026 — Apollo (blue)
Sul Solar — 12/01/2026 — Athena (purple)
Isocompósitos — 18/01/2026 — Ares (red)
Napelle Laser — 22/01/2026 — Artemis (green)
Thermal Beer — 28/01/2026 — Apollo (blue)
Lucab Corporate — 02/02/2026 — Athena (purple)
FMP — 10/02/2026 — Ares (red)
Aquiraz Investimentos — 18/02/2026 — Artemis (green)
```

### Squad badge colors
- Apollo: `bg-blue-500/15 text-blue-400`
- Athena: `bg-purple-500/15 text-purple-400`
- Ares: `bg-red-500/15 text-red-400`
- Artemis: `bg-green-500/15 text-green-400`

