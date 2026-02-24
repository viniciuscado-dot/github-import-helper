/**
 * External Supabase client — uses the real Supabase connection.
 * Cast as `any` because the auto-generated types.ts has no table definitions yet.
 */
import { supabase as typedSupabase } from '@/integrations/supabase/client';

// Cast to any to bypass empty type definitions in types.ts
export const externalSupabase = typedSupabase as any;
export const supabase = typedSupabase as any;
