/**
 * Feature flags for enabling/disabling backend-dependent features.
 */
export const featureFlags = {
  /** When false, all Anthropic/AI features show a "disabled" message */
  AI_ENABLED: false,
  /** When false, the app uses a local mock data layer instead of Supabase */
  SUPABASE_ENABLED: true,
};
