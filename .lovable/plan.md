

## Documentation: Users Module (Usuários)

I'll generate a comprehensive Markdown document covering the entire Users module — backend (database, edge functions, RLS, RPCs) and frontend (components, contexts, permission system). This will be saved to `/mnt/documents/USUARIOS_MODULE_DOCUMENTATION.md`.

### Content Structure

1. **Architecture Overview** — diagram of how frontend, AuthContext, Supabase DB, and Edge Functions connect
2. **Database Schema** — `profiles`, `custom_roles`, `modules`, `role_module_permissions`, `user_module_permissions` tables with columns, RLS policies, triggers (`handle_new_user`, `prevent_role_escalation`)
3. **Database Functions** — `get_user_role`, `user_has_module_permission`, `handle_new_user`, `prevent_role_escalation`
4. **Edge Functions** — `create-user` (admin creates users with service_role), `update-user-role` (promote/demote with hierarchy checks), `update-password` (admin resets passwords)
5. **Frontend — AuthContext** — session management, `fetchProfile`/`fetchProfiles`, domain restriction (`@dotconceito.com`), CRUD methods (`addUser`, `updateUser`, `removeUser`, `activateUser`)
6. **Frontend — UserManagement.tsx** — 3-tier collapsible sections (Workspace Admin, Admin Completo, Usuários Comuns), group (custom_roles) CRUD, role permissions editor (`RolePermissionsEditor`), user CRUD dialogs, avatar upload, squad assignment
7. **Frontend — UserPermissions.tsx** — per-user granular permissions dialog (view/create/edit/delete per module), organized by menu sections (Performance, Social Media, Laboratório, News)
8. **Frontend — useModulePermissions hook** — permission checking logic with hardcoded rules (public modules, banned modules, admin bypass)
9. **Permission Hierarchy** — workspace_admin > admin > equipe, bootstrap mode, `canEditUser` logic
10. **Security** — RLS policies, `prevent_role_escalation` trigger, edge functions using `service_role` to bypass RLS for admin operations

### Implementation
Single command to write the full `.md` file to `/mnt/documents/`.

