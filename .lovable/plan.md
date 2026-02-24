

## Diagnosis

The Social Media routes (`/social-media/planejamento` and `/social-media/varredura`) render standalone pages without the sidebar layout. Other pages like Aprovacao wrap their content with `SidebarProvider` + `AppSidebar` + `SidebarInset`. The Social Media pages lack this wrapper entirely.

## Plan

### 1. Create a reusable `PageComingSoon` component
**File:** `src/components/PageComingSoon.tsx`

- Accepts `title`, `subtitle`, and optional `badgeLabel` props
- Centered card with a subtle icon (Clock or Sparkles from lucide-react)
- Large "Em breve" heading, smaller subtitle text
- Subtle separator line
- Optional Badge (e.g. "Social Media")
- Uses existing design tokens (`Card`, `Badge`, `Separator` from ui components)
- Clean, minimal design matching the app's aesthetic

### 2. Update `SocialMediaPlanejamento` page
**File:** `src/pages/SocialMediaPlanejamento.tsx`

- Wrap with `SidebarProvider` + `AppSidebar` + `MobileSidebarTrigger` + `SidebarInset` (same pattern as `Aprovacao.tsx`)
- Set `activeView` to identify the current Social Media route
- `onViewChange` navigates to `/dashboard?view=${view}` (same as Aprovacao)
- Render `PageComingSoon` with title "Planejamento de Conteúdo" and subtitle "Estamos preparando algo estratégico para você." and badge "Social Media"

### 3. Update `SocialMediaVarredura` page
**File:** `src/pages/SocialMediaVarredura.tsx`

- Same sidebar wrapper pattern as above
- Render `PageComingSoon` with title "Varredura" and subtitle "Funcionalidade em desenvolvimento." and badge "Social Media"

### 4. Update `viewToRouteMap` in `PublicPageWithSidebar`
**File:** `src/components/PublicPageWithSidebar.tsx`

- Add entries for `'planejamento-conteudo': '/social-media/planejamento'` and `'varredura': '/social-media/varredura'` so navigation from sidebar works correctly

### 5. Update `CommandPalette`
**File:** `src/components/CommandPalette.tsx`

- Add Social Media entries to the pages array so they're searchable

### What will NOT change
- Sidebar styling, permissions logic, other existing routes — untouched
- App.tsx routes stay as-is (already correctly defined with `ProtectedRoute`)

