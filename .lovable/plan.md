

## Plan: Fix Missing Permission Tables in Database

### Problem
The error "Could not find the table 'public.modules' in the schema cache" occurs because the migration that creates the permission system tables (`modules`, `custom_roles`, `role_module_permissions`, `user_module_permissions`) and the `user_has_module_permission` RPC function was never successfully applied to the database. The migration file exists but likely failed during execution due to references to non-existent functions (`get_current_user_role()`, `update_updated_at_column()`).

### Fix
Create a new migration that safely creates all 4 missing tables, seeds default modules (updated for the current app), creates the RPC function, and sets up proper RLS policies -- all using functions that actually exist in the database (`get_user_role()`, `handle_updated_at()`).

### Database Migration

```sql
-- Create enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'sdr', 'closer', 'manager', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_role app_role NOT NULL DEFAULT 'custom',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role module permissions
CREATE TABLE IF NOT EXISTS public.role_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, module_id)
);

-- User module permissions (overrides)
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for modules
CREATE POLICY "Authenticated can view modules"
  ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','workspace_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin','workspace_admin'));

-- Policies for custom_roles
CREATE POLICY "Authenticated can view active roles"
  ON public.custom_roles FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','workspace_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin','workspace_admin'));

-- Policies for role_module_permissions
CREATE POLICY "Authenticated can view role perms"
  ON public.role_module_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage role perms"
  ON public.role_module_permissions FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','workspace_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin','workspace_admin'));

-- Policies for user_module_permissions
CREATE POLICY "Users can view own or admins all"
  ON public.user_module_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role(auth.uid()) IN ('admin','workspace_admin'));
CREATE POLICY "Admins can manage user perms"
  ON public.user_module_permissions FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','workspace_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin','workspace_admin'));

-- Seed current modules
INSERT INTO public.modules (name, display_name, description) VALUES
  ('users', 'Usuários', 'Gerenciamento de usuários'),
  ('profile', 'Meu Perfil', 'Configurações do perfil'),
  ('copy', 'Copy e Estratégia', 'Geração de copies'),
  ('analise-bench', 'Análise e Bench', 'Análise de benchmarking'),
  ('aprovacao', 'Aprovação', 'Fluxo de aprovação de materiais'),
  ('data-driven', 'Data-Driven', 'Gestão e produtividade'),
  ('anuncios', 'Anúncios', 'Performance de anúncios'),
  ('planejamento-conteudo', 'Planejamento', 'Planejamento de conteúdo'),
  ('varredura', 'Varredura', 'Varredura de redes sociais'),
  ('central-posts', 'Central de Posts', 'Central de posts'),
  ('noticias', 'Notícias', 'Notícias e conteúdos'),
  ('laboratorio', 'Laboratório', 'Ferramentas experimentais'),
  ('preferencias-interface', 'Preferências', 'Preferências de interface')
ON CONFLICT (name) DO NOTHING;

-- Recreate the RPC function using correct column (id, not user_id)
CREATE OR REPLACE FUNCTION public.user_has_module_permission(
  _user_id UUID,
  _module_name TEXT,
  _permission_type TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_perm BOOLEAN;
  user_role_id UUID;
BEGIN
  -- Admin = full access
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role IN ('admin','workspace_admin')) THEN
    RETURN true;
  END IF;

  -- Get custom role
  SELECT custom_role_id INTO user_role_id FROM public.profiles WHERE id = _user_id;

  -- Check user-level override first
  SELECT CASE
    WHEN _permission_type = 'view' THEN can_view
    WHEN _permission_type = 'create' THEN can_create
    WHEN _permission_type = 'edit' THEN can_edit
    WHEN _permission_type = 'delete' THEN can_delete
    ELSE false
  END INTO has_perm
  FROM public.user_module_permissions ump
  JOIN public.modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id AND m.name = _module_name;

  IF has_perm IS NOT NULL THEN RETURN has_perm; END IF;

  -- Check role-level
  IF user_role_id IS NOT NULL THEN
    SELECT CASE
      WHEN _permission_type = 'view' THEN can_view
      WHEN _permission_type = 'create' THEN can_create
      WHEN _permission_type = 'edit' THEN can_edit
      WHEN _permission_type = 'delete' THEN can_delete
      ELSE false
    END INTO has_perm
    FROM public.role_module_permissions rmp
    JOIN public.modules m ON m.id = rmp.module_id
    WHERE rmp.role_id = user_role_id AND m.name = _module_name;
  END IF;

  RETURN COALESCE(has_perm, false);
END;
$$;
```

### No Code Changes Needed
The frontend code already references these tables and the RPC function correctly. Once the tables exist, the error will be resolved.

