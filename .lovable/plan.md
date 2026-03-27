

## Plan: Create Premium Intro Screen ("Módulo de Criação")

### Overview
Create a new landing/intro page at `/` that displays before the login screen. It features a cinematic dark background, GSAP-powered zoom+blur transition, and a "Criar" CTA button that navigates to `/auth`.

### What Changes

**1. New page: `src/pages/Intro.tsx`**
- Full-screen dark background (`#0f0505`) with subtle radial glow (blue/cyan tones matching existing glass system)
- Title: "Módulo de Criação" — large, bold, white with slight transparency
- Subtitle: "Crie, organize e execute projetos com velocidade e clareza" — muted opacity
- CTA button "Criar" with the red gradient from the HTML reference, shine animation, reflection effect, hover lift
- On click: GSAP animation (zoom scale ~6x + blur ~20px on the intro section over ~1.5s), then navigate to `/auth`
- Second section (destiny) fades in during transition as visual backdrop
- All CSS is scoped inside the component (inline styles or a dedicated CSS module) — no changes to `index.css`
- GSAP loaded via CDN script tag or `gsap` npm package

**2. Update routing in `src/App.tsx`**
- Change `"/"` from `<Navigate to="/dashboard">` to render the new `<Intro />` page
- Add lazy import for Intro
- Keep `/auth` and `/dashboard` routes unchanged

**3. Install GSAP**
- Add `gsap` as npm dependency for the zoom+blur transition animation

### Layout structure (Intro page)
```text
┌──────────────────────────────────┐
│  (dark bg + radial glow)         │
│                                  │
│      Módulo de Criação           │  ← text-5xl bold white/90
│  Crie, organize e execute...     │  ← text-lg white/50
│                                  │
│         [ Criar ]                │  ← red gradient button + shine
│                                  │
└──────────────────────────────────┘
```

### Button styling
- Replicates the HTML reference: red radial gradient, white border, box-shadow, shine sweep animation (`@keyframes brilho`), hover brightness+lift, active scale
- Reflection effect via CSS `-webkit-box-reflect`

### Transition on click
1. GSAP `gsap.to()` on intro container: `scale: 6, filter: "blur(20px)", opacity: 0` over 1.5s with `power2.inOut` easing
2. After animation completes → `navigate('/auth')`

### Files
- **Create**: `src/pages/Intro.tsx`
- **Modify**: `src/App.tsx` (route change + lazy import)
- **Install**: `gsap` package

### What stays unchanged
- Auth page, dashboard, sidebar, all existing logic
- `index.css` global styles
- No new backend or database changes

