
-- Profiles table (complementary to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  department text,
  role text NOT NULL DEFAULT 'equipe' CHECK (role IN ('workspace_admin', 'admin', 'equipe')),
  group_name text,
  squad text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  project_scope text DEFAULT 'both',
  custom_role_id uuid,
  selected_celebration_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- RLS policies
-- Everyone authenticated can read all profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Only admins can insert profiles (via edge function with service_role)
-- Anon/authenticated insert blocked; edge function bypasses RLS
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('workspace_admin', 'admin')
);

-- Only workspace_admin can delete
CREATE POLICY "Workspace admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'workspace_admin'
);

-- Admin update policy (admins can update any profile)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('workspace_admin', 'admin')
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('workspace_admin', 'admin')
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
