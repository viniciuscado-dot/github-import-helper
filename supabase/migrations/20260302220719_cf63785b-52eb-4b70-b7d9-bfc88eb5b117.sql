ALTER TABLE public.analise_bench_forms
  ADD CONSTRAINT analise_bench_forms_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;