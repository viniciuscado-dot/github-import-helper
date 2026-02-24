/**
 * External Supabase client — now delegates to the mock layer
 * so the app runs entirely in the browser without any backend.
 *
 * To switch back to the real Supabase project, set
 * SUPABASE_ENABLED = true in src/config/featureFlags.ts
 * and restore the original createClient call.
 */

import { featureFlags } from '@/config/featureFlags';
import { mockSupabase } from '@/mocks/mockSupabaseClient';

let client: any;

if (featureFlags.SUPABASE_ENABLED) {
  // Dynamic import would go here – but for now Supabase is disabled
  // so we never initialise the real client and avoid needing env vars.
  console.warn('[external-client] Supabase flag is ON but real client is not wired. Using mock.');
  client = mockSupabase;
} else {
  client = mockSupabase;
}

export const externalSupabase = client;
export const supabase = client;
