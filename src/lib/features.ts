import { env } from '@/lib/env';

/**
 * Feature flags for the Kel Dashboard.
 * All feature flags should be defined here for centralized control.
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
};

/**
 * Feature flags object.
 * Read from environment variables with sensible defaults.
 *
 * All flags default to `false` (most restrictive) for safety.
 * Enable features by setting the corresponding environment variable.
 *
 * Note: Object.freeze() provides runtime immutability, `satisfies` provides
 * TypeScript validation while preserving literal types from `as const`.
 */
export const FEATURES = Object.freeze({
  OFFLINE_MODE: env.NEXT_PUBLIC_OFFLINE_ENABLED === 'true',
} as const satisfies Features);
