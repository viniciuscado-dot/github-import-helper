
-- =============================================
-- Phase 1: Database Schema for Approval System
-- =============================================

-- 1) PROJECTS
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'estatico',
  external_reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Extra fields to preserve existing job data shape
  client_name TEXT,
  campaign_name TEXT,
  designer_name TEXT,
  copywriter_name TEXT,
  squad TEXT,
  squad_source TEXT DEFAULT 'auto',
  status TEXT NOT NULL DEFAULT 'rascunho',
  caption TEXT,
  copy_text TEXT,
  format TEXT,
  deadline DATE,
  notes TEXT
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- 2) MATERIALS
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  is_active_version BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  caption TEXT,
  copy_text TEXT,
  designer_name TEXT,
  copywriter_name TEXT
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_materials_project ON public.materials(project_id);
CREATE INDEX idx_materials_active ON public.materials(project_id, is_active_version);

-- 3) MATERIAL FILES
CREATE TABLE public.material_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  slot TEXT DEFAULT 'feed',
  creative_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.material_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to material_files" ON public.material_files FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_material_files_material ON public.material_files(material_id);

-- 4) EVALUATIONS
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  copy_score NUMERIC,
  design_score NUMERIC,
  feedback_copy TEXT,
  feedback_design TEXT,
  is_official BOOLEAN NOT NULL DEFAULT false,
  creative_index INTEGER DEFAULT 0,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to evaluations" ON public.evaluations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_evaluations_material ON public.evaluations(material_id);

-- 5) KANBAN STATUS
CREATE TABLE public.kanban_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  column_status TEXT NOT NULL DEFAULT 'rascunho',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to kanban_status" ON public.kanban_status FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_kanban_material ON public.kanban_status(material_id);

-- 6) KPIs
CREATE TABLE public.kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to kpis" ON public.kpis FOR ALL USING (true) WITH CHECK (true);

-- 7) STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('material-files', 'material-files', true);

CREATE POLICY "Public read access for material-files" ON storage.objects FOR SELECT USING (bucket_id = 'material-files');

CREATE POLICY "Allow uploads to material-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'material-files');

CREATE POLICY "Allow updates to material-files" ON storage.objects FOR UPDATE USING (bucket_id = 'material-files');

CREATE POLICY "Allow deletes from material-files" ON storage.objects FOR DELETE USING (bucket_id = 'material-files');
