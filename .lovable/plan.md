

## Plan: Redesign Auth Login Page with Glassmorphism

### Changes — `src/pages/Auth.tsx` only

**1. Remove "Módulo de Criação" title** — delete the brand/h1 section entirely.

**2. Shrink logo** — reduce `DotLogo size` from 64 to 36, remove the large card wrapper around it.

**3. Unify into a single glass card** — wrap logo + form into one glassmorphism container:
- `background: rgba(255, 255, 255, 0.04)`
- `backdrop-filter: blur(16px)`
- `border: 1px solid rgba(255, 255, 255, 0.08)`
- `border-radius: 2rem`
- Subtle inner glow shadow

**4. Add decorative elements from reference HTML** — inside the glass card:
- Two floating "bubble" divs (translucent circles with subtle animation, like the reference `float-bubble-1/2`)
- A specular shine layer that follows a subtle CSS animation
- A faint conic-gradient rotating border effect (the `::before` pseudo-element from the reference), but very subtle/slow for a professional SaaS feel

**5. Background enhancements** — the page background gets:
- Dark base matching existing dark theme
- Subtle radial gradient glows (blue/purple tones, consistent with existing glass system)

**6. Keep all logic untouched** — `handleLogin`, auth state, navigation, loading state remain identical.

### Visual structure
```text
┌─────────────────────────────────┐
│  (dark bg + radial glows)       │
│                                 │
│   ┌───────────────────────┐     │
│   │  [DOT logo small]    │     │  ← glass card with rotating border
│   │                       │     │
│   │  Faça login...        │     │
│   │  ┌─────────────────┐  │     │
│   │  │ E-mail           │  │     │
│   │  └─────────────────┘  │     │
│   │  ┌─────────────────┐  │     │
│   │  │ Senha            │  │     │
│   │  └─────────────────┘  │     │
│   │  [ Entrar ]           │     │
│   │   (bubbles floating)  │     │
│   └───────────────────────┘     │
│                                 │
│   Powered by DOT Conceito       │
└─────────────────────────────────┘
```

### Files Modified
- `src/pages/Auth.tsx` — visual-only changes, scoped `<style>` tag for animations

### Unchanged
- All auth logic, state, navigation
- No backend/database changes
- No changes to `index.css`

