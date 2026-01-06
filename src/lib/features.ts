/**
 * Feature flags for the Kel Dashboard.
 * All feature flags should be defined here for centralized control.
 *
 * IMPORTANT: For client-side feature flags, we must access process.env.NEXT_PUBLIC_*
 * directly (not through a function) because Next.js replaces these at build time.
 * Dynamic access via getters doesn't work on the client.
 *
 * @example
 * ```typescript
 * import { FEATURES } from '@/lib/features';
 *
 * if (FEATURES.OFFLINE_MODE) {
 *   // Offline-specific logic
 * }
 *
 * // In JSX:
 * {FEATURES.OFFLINE_MODE && <OfflineIndicator />}
 * ```
 */

/**
 * Type definition for all feature flags.
 * Add new flags here as the project grows.
 */
export type Features = {
  /**
   * Enables offline mode and sync functionality.
   * MVP ships with this set to `false`.
   * Post-MVP: Set `NEXT_PUBLIC_OFFLINE_ENABLED=true` to enable.
   */
  readonly OFFLINE_MODE: boolean;

  /**
   * Enables offline read-only mode UI.
   * Shows offline banner and blocks writes when offline.
   * This is lightweight - no IndexedDB queue or sync engine.
   * Set `NEXT_PUBLIC_OFFLINE_READ=true` to enable.
   */
  readonly OFFLINE_READ: boolean;
};

/**
 * Feature flags object.
 * Read from environment variables with sensible defaults.
 *
 * All flags default to `false` (most restrictive) for safety.
 * Enable features by setting the corresponding environment variable.
 *
 * Note: We access process.env.NEXT_PUBLIC_* directly here because Next.js
 * replaces these static references at build time. Using getters or functions
 * to access these variables doesn't work on the client side.
 *
 * Object.freeze() provides runtime immutability, `satisfies` provides
 * TypeScript validation while preserving literal types from `as const`.
 */
export const FEATURES = Object.freeze({
  OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_ENABLED === 'true',
  OFFLINE_READ: process.env.NEXT_PUBLIC_OFFLINE_READ === 'true',
} as const satisfies Features);
