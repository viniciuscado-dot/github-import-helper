-- Add lab sub-modules that are in the sidebar but missing from modules table
INSERT INTO public.modules (name, display_name, description, is_active) VALUES
  ('editor-video', 'Editor de Vídeo', 'Editor de vídeo do laboratório', true),
  ('banco-ideias', 'Banco de Ideias', 'Banco de ideias criativas', true),
  ('lp-builder', 'LP Builder', 'Construtor de landing pages', true),
  ('diagnostico-visual', 'Diagnóstico Visual', 'Diagnóstico visual de criativos', true),
  ('ai-agent', 'AI Agent', 'Agente de IA do laboratório', true)
ON CONFLICT DO NOTHING;

-- Seed default custom roles
INSERT INTO public.custom_roles (name, display_name, description, base_role, is_active, created_by) VALUES
  ('gestor', 'Gestor de Projetos', 'Acesso completo a operação e performance', 'manager', true, (SELECT id FROM auth.users LIMIT 1)),
  ('analista', 'Analista', 'Acesso a análises, benchmarks e relatórios', 'custom', true, (SELECT id FROM auth.users LIMIT 1)),
  ('designer', 'Designer', 'Acesso a aprovação, laboratório e social media', 'custom', true, (SELECT id FROM auth.users LIMIT 1)),
  ('copywriter', 'Copywriter', 'Acesso a copy, estratégia e aprovação', 'custom', true, (SELECT id FROM auth.users LIMIT 1)),
  ('social_media', 'Social Media', 'Acesso a social media e conteúdo', 'custom', true, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;