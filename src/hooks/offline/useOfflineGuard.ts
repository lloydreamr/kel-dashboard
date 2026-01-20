/**
 * useOfflineGuard Hook
 *
 * Provides a guard function to prevent write operations while offline.
 * Used in mutation hooks to block writes and show user-friendly toast.
 *
 * Story 10.3: Offline Read-Only Mode (Task 5)
 *
 * @example
 * ```tsx
 * const { guardOffline } = useOfflineGuard();
 *
 * const mutation = useMutation({
 *   mutationFn: async (input) => {
 *     guardOffline(); // Throws OfflineError if offline
 *     return api.create(input);
 *   },
 *   onError: (error) => {
 *     if (isOfflineError(error)) return; // Toast already shown
 *     toast.error('Failed');
 *   }
 * });
 * ```
 */

import { toast } from 'sonner';

import { FEATURES } from '@/lib/features';

/**
 * Toast ID for deduplication - prevents multiple toasts when
 * user rapidly clicks buttons while offline.
 */
export const OFFLINE_TOAST_ID = 'offline-write-blocked';

/**
 * Toast message shown when write operations are blocked.
 */
export const OFFLINE_MESSAGE = 'Unavailable offline - changes will sync when online';

/**
 * Custom error class for offline write attempts.
 * Used to identify offline errors in onError handlers.
 */
export class OfflineError extends Error {
  readonly isOfflineError = true;

  constructor() {
    super(OFFLINE_MESSAGE);
    this.name = 'OfflineError';
  }
}

/**
 * Type guard to check if an error is an OfflineError.
 * Use in onError handlers to avoid showing duplicate error toasts.
 */
export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError ||
    (typeof error === 'object' && error !== null && 'isOfflineError' in error);
}

export interface UseOfflineGuardResult {
  /**
   * Guard function that checks online status.
   * Throws OfflineError if offline and feature enabled.
   * Use isOfflineError() in onError to detect.
   */
  guardOffline: () => void;
}

/**
 * useOfflineGuard - Provides guard function for mutation hooks.
 *
 * Per AC#3: When user attempts write operation while offline,
 * the operation is blocked and a toast appears.
 *
 * Uses navigator.onLine for real-time check (not hook state which
 * could be stale by the time the mutation runs).
 *
 * Per AC#6: Only shows toast when FEATURES.OFFLINE_READ is enabled.
 */
export function useOfflineGuard(): UseOfflineGuardResult {
  const guardOffline = (): void => {
    // Check real-time online status (not hook state)
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // If online, allow the operation
    if (isOnline) {
      return;
    }

    // If feature flag is disabled, allow the operation
    // (let it fail naturally with network error)
    if (!FEATURES.OFFLINE_READ) {
      return;
    }

    // Offline and feature enabled: show toast and throw error
    toast.error(OFFLINE_MESSAGE, {
      id: OFFLINE_TOAST_ID,
      duration: 4000,
    });

    throw new OfflineError();
  };

  return { guardOffline };
}
