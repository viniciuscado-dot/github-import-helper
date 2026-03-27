

## Plan: Add Mouse-Follow Specular Effect to All Cards

### Approach
Modify the `Card` component in `src/components/ui/card.tsx` to include the mouse-follow specular shine effect. Since every card in the app uses this component, the effect will be applied globally with a single change.

### Changes — `src/components/ui/card.tsx` only

**1. Add mouse tracking to the Card component**
- Add an internal ref (merged with forwarded ref) and an `onMouseMove` handler that sets `--mouse-x` and `--mouse-y` CSS variables on the card element.
- Inject a specular overlay `<div>` as the first child inside every Card, absolutely positioned, with `pointer-events: none` so it doesn't interfere with content.
- Add `position: relative` and `overflow: hidden` to the card base classes.

**2. Specular overlay styling (inline or scoped)**
- `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06) 0%, transparent 60%)`
- `opacity: 0` by default, `opacity: 1` on card hover via group-hover
- Smooth `transition: opacity 0.3s ease`
- `z-index: 1` with `pointer-events: none`

**3. Card children get `relative z-[2]`** — not needed since specular has `pointer-events: none` and low opacity. The overlay is purely decorative.

### Visual result
Every card across the entire app (dashboards, KPIs, forms, approval cards, etc.) will show a subtle light spot following the mouse cursor on hover, matching the login page effect.

### What stays unchanged
- All card content, layout, logic, and responsiveness
- No changes to `index.css` or any other component files
- CardHeader, CardTitle, CardContent, CardFooter, CardDescription unchanged

### Files Modified
- `src/components/ui/card.tsx`

