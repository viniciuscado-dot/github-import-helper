
-- Add missing columns to projects for full job data compatibility
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS share_token TEXT DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS responsible_user_id TEXT,
  ADD COLUMN IF NOT EXISTS responsible_name TEXT,
  ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'estaticos',
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attached_files JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS static_creative_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS static_captions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS static_files_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS video_files_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS video_captions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS video_notes JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS landing_page_link TEXT,
  ADD COLUMN IF NOT EXISTS creation_date TEXT,
  ADD COLUMN IF NOT EXISTS sent_for_approval_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pending_creative_indices JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Add missing columns to evaluations for full feedback data
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS copy_comment TEXT,
  ADD COLUMN IF NOT EXISTS design_comment TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS per_creative JSONB;

CREATE INDEX IF NOT EXISTS idx_evaluations_project ON public.evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON public.projects(share_token);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
