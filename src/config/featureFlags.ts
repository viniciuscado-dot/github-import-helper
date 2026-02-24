/**
 * Feature flags for enabling/disabling backend-dependent features.
 * Set to `false` to run the app in front-end-only mode with mock data.
 */
export const featureFlags = {
  /** When false, all Anthropic/AI features show a "disabled" message */
  AI_ENABLED: false,
  /** When false, the app uses a local mock data layer instead of Supabase */
  SUPABASE_ENABLED: false,
};
