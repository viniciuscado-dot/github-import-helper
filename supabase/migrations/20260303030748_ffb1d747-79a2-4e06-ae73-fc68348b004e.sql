-- Bucket for AI-generated news thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-thumbnails', 'news-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can read news thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-thumbnails');

-- Allow edge functions (service role) to insert
CREATE POLICY "Service role can insert news thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-thumbnails');

-- Table mapping news article → stored thumbnail
CREATE TABLE public.news_thumbnails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_key text NOT NULL UNIQUE,  -- hash of title+url for stable matching
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public read, no RLS needed (public content)
ALTER TABLE public.news_thumbnails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news thumbnails"
ON public.news_thumbnails FOR SELECT
USING (true);

CREATE POLICY "Service can insert news thumbnails"
ON public.news_thumbnails FOR INSERT
WITH CHECK (true);