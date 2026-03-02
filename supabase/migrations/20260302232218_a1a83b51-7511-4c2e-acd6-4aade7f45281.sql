
-- Add share_token column to analise_bench_forms
ALTER TABLE public.analise_bench_forms
  ADD COLUMN share_token text UNIQUE DEFAULT gen_random_uuid()::text;

-- RLS policy for public/anon access via share_token
CREATE POLICY "Public can read by share_token"
  ON public.analise_bench_forms
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);
