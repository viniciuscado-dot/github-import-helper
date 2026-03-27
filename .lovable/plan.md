

## Plan: Replace Bubbles with Mouse-Follow Specular Effect on Auth Page

### Changes — `src/pages/Auth.tsx` only

**1. Remove bubble elements**
Delete the two `auth-bubble` divs (lines 59-60) and all their CSS (`.auth-bubble`, `.auth-bubble-1`, `.auth-bubble-2`, `@keyframes auth-float-1`, `@keyframes auth-float-2`).

**2. Add mouse-follow specular shine**
- Add a `useRef` for the card and an `onMouseMove` handler that sets `--mouse-x` and `--mouse-y` CSS variables on the card element (same pattern as the reference HTML's `GlassCard`).
- Update `.auth-specular` CSS to use `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08) 0%, transparent 60%)` instead of the static linear gradient.
- Add `opacity: 0` by default and `opacity: 1` on `.auth-glass-card:hover .auth-specular` with a smooth transition.

**3. Keep rotating border effect** — unchanged, it stays as-is.

### What stays unchanged
- All auth logic, state, navigation
- Glass card structure, logo, form
- Background radial glows
- No `index.css` changes

### Files Modified
- `src/pages/Auth.tsx`

