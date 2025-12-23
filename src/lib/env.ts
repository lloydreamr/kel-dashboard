/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup.
 * Import this module early in your app to catch missing env vars.
 *
 * @example
 * import { env } from '@/lib/env';
 * console.log(env.SUPABASE_URL);
 */

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Copy .env.local.example to .env.local and fill in the values.`
    );
  }
  return value;
}

function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

/**
 * Validated environment variables.
 * Access these instead of process.env directly for type safety.
 */
export const env = {
  /** Supabase project URL */
  get SUPABASE_URL(): string {
    return getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  },

  /** Supabase anon/public key */
  get SUPABASE_ANON_KEY(): string {
    return getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },

  /** Supabase service role key (server-side only) */
  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    return getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  },

  /** Current environment */
  get NODE_ENV(): string {
    return process.env.NODE_ENV ?? 'development';
  },

  /** Is development mode */
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },

  /** Is production mode */
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  // ─────────────────────────────────────────────────────────────────
  // Feature Flags (Optional)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Enables offline mode and sync functionality.
   * Set to "true" to enable. Default: undefined (disabled).
   * Post-MVP feature - do not enable for initial launch.
   */
  get NEXT_PUBLIC_OFFLINE_ENABLED(): string | undefined {
    return getOptionalEnvVar('NEXT_PUBLIC_OFFLINE_ENABLED');
  },
} as const;

/**
 * Validate all required env vars exist.
 * Call this at app startup to fail fast if config is missing.
 */
export function validateEnv(): void {
  // Access each required var to trigger validation
  void env.SUPABASE_URL;
  void env.SUPABASE_ANON_KEY;
}
