

## Plan: Admin-Only Restrictions + Section "Todos" + Clean Footer

### 5 Changes

**1. Hide Data-Driven from non-admin users in sidebar**
In `src/components/app-sidebar.tsx`, wrap the Data-Driven `<SidebarMenuItem>` with `{profile?.effectiveRole === 'admin' && (...)}`.

**2. Hide "Usuários" from non-admin users in sidebar**
Already has admin check, but also remove it from the permissions menu structures (step 4).

**3. Restrict prompt editing to admin-only**
- `src/components/CopyForm.tsx`: change `canAccessPrompts` to require admin role only.
- `src/components/AnaliseBench.tsx`: same restriction on prompts tab.

**4. Clean up permissions menu structures**
In both `src/components/UserPermissions.tsx` and `src/components/UserManagement.tsx`:
- Remove **Data-Driven**, **Configurações** (Usuários), sections from `menuStructure` — these are admin-only and shouldn't appear in per-user permission editing.
- Keep only: Performance, Social Media, Laboratório, News.

**5. Add section-level "Todos" checkbox**
In both `UserPermissions.tsx` and `UserManagement.tsx`, add a "Todos" checkbox next to each section header (Performance, Social Media, etc.):
- Checked = all modules in that section have all 4 permissions enabled
- Toggle = sets all permissions for all modules in the section

Helper functions: `hasAllSectionPermissions(section)`, `toggleAllSectionPermissions(section, value)`.

### Sidebar footer remains
Only these items stay in the footer for all users:
- **Data-Driven** (admin only — hidden for non-admins)
- **Usuários** (admin only — already gated)
- **Voltar para módulos**
- **Sair**
- **User avatar/name**

### Files Modified
- `src/components/app-sidebar.tsx`
- `src/components/CopyForm.tsx`
- `src/components/AnaliseBench.tsx`
- `src/components/UserPermissions.tsx`
- `src/components/UserManagement.tsx`

### Unchanged
All backend, database, navigation logic, and existing module permission checks.

