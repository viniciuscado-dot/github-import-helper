

## Plan: Add Shimmer + Icon Reveal Effect to Sidebar Menu Items

### What changes

**Single file: `src/components/app-sidebar.tsx`**

Add a scoped `<style>` block inside the component with the hover effects from the reference, adapted to the sidebar's existing structure. Modify the `renderMenuItem` helper to apply the effect classes.

### Effect details (expanded sidebar only)

1. **Icon reveal on hover** — Icons start with `opacity: 0`, `width: 0`, `transform: scale(0.2)`. On hover they animate to full size with a smooth 0.5s transition.
2. **Shimmer border** — Each menu button gets a `::before` pseudo-element with a traveling gradient shine on hover (the `shinerySync` keyframe).
3. **Active items** keep their current red highlight styling unchanged.
4. **Collapsed sidebar** — No changes, tooltip behavior stays identical.

### Implementation

1. Add a `<style>` block inside the return, with:
   - `.sidebar-menu-item` base styles: `position: relative`, `overflow: hidden`, `transition: 0.3s`
   - `.sidebar-menu-item::before` shimmer pseudo-element (hidden by default, visible on hover with `shinerySync` animation)
   - `.sidebar-menu-item .sidebar-icon` — starts at `opacity: 0; width: 0; transform: scale(0.2); transition: 0.5s`
   - `.sidebar-menu-item:hover .sidebar-icon` — `opacity: 1; width: 20px; transform: scale(1.05); margin-right: 8px`

2. Update `renderMenuItem` (expanded mode only):
   - Add `sidebar-menu-item` class to `SidebarMenuButton`
   - Add `sidebar-icon` class to the `Icon` wrapper
   - Text stays as-is

3. Footer items (Settings, Logout, Data-Driven, Users) get the same classes.

### What stays unchanged
- All colors, active states, navigation, routes, structure
- Collapsed sidebar behavior and tooltips
- Footer user profile section
- Group labels and spacing

### Files Modified
- `src/components/app-sidebar.tsx`

