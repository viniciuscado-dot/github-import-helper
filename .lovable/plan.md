

## Plan: Show Icons Always, Keep Shimmer Animation

### Single change in `src/components/app-sidebar.tsx`

Update the `.sidebar-icon` CSS (lines 178-194) so icons are **always visible** instead of hidden by default:

**Current** (icons hidden, revealed on hover):
```css
.sidebar-menu-item .sidebar-icon {
  opacity: 0;
  width: 0;
  transform: scale(0.2);
  ...
}
.sidebar-menu-item:hover .sidebar-icon {
  opacity: 1;
  width: 20px;
  transform: scale(1.05);
  margin-right: 4px;
}
```

**New** (icons always visible, subtle scale on hover):
```css
.sidebar-menu-item .sidebar-icon {
  opacity: 1;
  width: 20px;
  transform: scale(1);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4px;
}
.sidebar-menu-item:hover .sidebar-icon {
  transform: scale(1.1);
}
```

The shimmer border `::before` animation stays exactly as-is.

### Files Modified
- `src/components/app-sidebar.tsx` (CSS only, lines 178-194)

