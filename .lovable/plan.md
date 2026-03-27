

## Plan: Apply Glassmorphism Design System (with Usability Guardrails)

### Approach
All changes in **`src/index.css` only**. No component files, logic, or structure changes.

### What Changes

**1. Add glass tokens to `:root` and `.dark`**
- `--glass-bg`, `--glass-bg-hover`, `--glass-border`, `--glass-border-hover`
- `--glass-shadow`, `--glass-shadow-hover`, `--glass-inset`, `--glass-blur`
- Light mode: subtle values (higher opacity). Dark mode: low-opacity values.

**2. Dark mode page depth**
- Subtle radial gradients on `body` background for layered feel.

**3. Glass utility classes** (`@layer components`)
- `.glass-card`, `.glass-card-hover`, `.glass-header`, `.glass-sidebar`, `.glass-modal`

**4. Automatic dark-mode overrides** — applied selectively:

| Target | Effect | Notes |
|---|---|---|
| Cards (`[data-slot="card"]`, `.rounded-lg.border.bg-card`) | Glass bg + blur + border + shadow | Hover: subtle lift + brighter border |
| Dialogs (`[role="dialog"]`) | Stronger blur (16px) | Modal overlay depth |
| TopBar (`.sticky.top-0.border-b`) | Semi-transparent bg + blur | Very subtle |
| Sidebar (`[data-sidebar="sidebar"]`) | Slight transparency + blur(8px) | Minimal change |
| Popovers | Blur + glass border | Light touch |
| Primary buttons hover | Soft glow shadow | Dark mode only |

**5. Usability and readability guardrails**

Do **not** apply glass styles blindly. The following rules are enforced:

- **Tables and dense data**: No transparency on `<table>`, `<tbody>`, `<td>`, or `<tr>` backgrounds. Only `<thead>` gets a very subtle tint (`rgba(255,255,255,0.03)`). Table containers (outer card) get glass, but table content stays opaque for scan-ability.
- **Inputs and text areas**: Explicitly excluded from glass overrides. Add a reset rule:
  ```css
  .dark input, .dark textarea, .dark select,
  .dark [role="combobox"], .dark [role="listbox"] {
    backdrop-filter: none;
    background: hsl(var(--input));
  }
  ```
- **Text contrast**: No opacity or transparency on text elements. All `color` values remain as-is (HSL tokens). Glass applies only to **container backgrounds**, never to foreground content.
- **Cards with heavy text content** (prose, results): Glass bg stays at `0.04` max — never lower. The `--glass-bg` token ensures consistency.
- **Scope**: Glass applies to containers (cards, panels, modals, header, sidebar). Not to inline elements, badges, buttons (except hover glow), or form controls.

**6. Performance**
- No continuous animations. `backdrop-filter` is GPU-accelerated. Transitions only on hover (0.3s ease).

### Files Modified
- `src/index.css` — single file, CSS-only changes

### What stays unchanged
- All `.tsx` component files
- All logic, state, routing, navigation
- Responsiveness and layout
- Light mode (subtle glass only, high contrast preserved)

