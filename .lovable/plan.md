

## Plan: Reinforce Glassmorphism — More Depth, Glow & Gradients

### Problem
The current glass tokens and overrides are too subtle to be visually perceived. The user wants a more noticeable premium feel: internal glow, blue/cyan gradients, and layered depth — while staying professional (no landing-page animations).

### Changes — `src/index.css` only

**1. Enhance dark-mode glass tokens**
```css
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-hover: rgba(255, 255, 255, 0.09);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-border-hover: rgba(255, 255, 255, 0.16);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
--glass-shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.5);
--glass-inset: inset 0 1px 1px rgba(255, 255, 255, 0.06), inset 0 0 20px rgba(100, 180, 255, 0.03);
--glass-blur: 14px;
--glass-glow: inset 0 0 30px rgba(80, 160, 255, 0.04);
```

**2. Richer page background depth**
Replace the current 2-gradient body bg with 3 layered radial gradients using blue/cyan tones:
```css
.dark body {
  background-image:
    radial-gradient(ellipse 80% 50% at 15% -5%, hsl(220 60% 18% / 0.5) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 85% 100%, hsl(200 50% 15% / 0.35) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 50% 50%, hsl(215 40% 12% / 0.2) 0%, transparent 60%);
}
```

**3. Cards — add internal glow**
```css
.dark [data-slot="card"] {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border-color: var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-inset), var(--glass-glow);
}
.dark [data-slot="card"]:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  box-shadow: var(--glass-shadow-hover), var(--glass-inset),
    inset 0 0 40px rgba(80, 160, 255, 0.06);
  transform: translateY(-2px);
}
```

**4. Dialogs — stronger glass + cyan glow**
```css
.dark [role="dialog"] {
  background: rgba(12, 14, 22, 0.88);
  backdrop-filter: blur(20px);
  border-color: var(--glass-border);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.06),
    inset 0 0 40px rgba(80, 160, 255, 0.04);
}
```

**5. TopBar — subtle cyan gradient border**
```css
.dark .sticky.top-0.border-b {
  background: rgba(12, 14, 22, 0.75) !important;
  backdrop-filter: blur(16px);
  border-color: rgba(100, 180, 255, 0.08) !important;
}
```

**6. Sidebar — slight glow along the edge**
```css
.dark [data-sidebar="sidebar"] {
  background: rgba(14, 16, 24, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: inset -1px 0 0 rgba(100, 180, 255, 0.05);
}
```

**7. Button hover glow — cyan/blue aura**
```css
.dark button[class*="bg-primary"]:hover {
  box-shadow: 0 0 24px hsl(var(--primary) / 0.35),
    0 0 60px rgba(80, 160, 255, 0.1);
}
```

**8. Popovers — glass + glow**
```css
.dark [data-radix-popper-content-wrapper] > div {
  backdrop-filter: blur(16px);
  border-color: rgba(100, 180, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 20px rgba(80, 160, 255, 0.03);
}
```

### What stays unchanged
- All usability guardrails (inputs, tables, text) remain exactly as-is
- No `.tsx` changes, no logic, no structure changes
- No continuous animations — effects are static + hover transitions only
- Light mode remains subtle

### Summary of visual impact
- Cards gain a visible frosted-glass feel with faint blue internal glow
- Page background has more perceivable depth layers (blue/cyan tones)
- Modals float with stronger separation from content behind
- Hover states feel more alive with brighter borders and lift
- Overall: premium SaaS aesthetic, not a flashy landing page

