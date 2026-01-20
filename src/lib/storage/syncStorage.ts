/**
 * Sync Storage Utilities
 *
 * localStorage utilities for persisting sync-related data.
 * These are simple wrappers that handle SSR safety and error handling.
 *
 * Note: These functions do NOT check FEATURES.OFFLINE_READ - that's
 * the caller's responsibility (useSyncStatus handles it). This keeps
 * the storage layer pure and testable.
 *
 * Story 10.4: Offline Detection & Sync Indicator (Task 7)
 *
 * @example
 * ```typescript
 * import { getSyncTimestamp, setSyncTimestamp } from '@/lib/storage/syncStorage';
 *
 * // Get last sync time (returns null if never synced or SSR)
 * const lastSync = getSyncTimestamp();
 *
 * // Update sync time after successful fetch
 * setSyncTimestamp(new Date());
 * ```
 */

const SYNC_STORAGE_KEY = 'kel-last-sync';

/**
 * Get the last sync timestamp from localStorage.
 * Returns null if never synced, on server-side, or on error.
 *
 * Note: Caller should check FEATURES.OFFLINE_READ before using.
 */
export function getSyncTimestamp(): Date | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!stored) return null;
    const timestamp = parseInt(stored, 10);
    if (isNaN(timestamp)) return null;
    return new Date(timestamp);
  } catch {
    // localStorage may be unavailable or quota exceeded
    return null;
  }
}

/**
 * Save the sync timestamp to localStorage.
 *
 * Note: Caller should check FEATURES.OFFLINE_READ before calling.
 */
export function setSyncTimestamp(date: Date): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SYNC_STORAGE_KEY, String(date.getTime()));
  } catch {
    // Silently fail - sync tracking is not critical
  }
}

/**
 * Clear the sync timestamp from localStorage.
 *
 * Note: Caller should check FEATURES.OFFLINE_READ before calling.
 */
export function clearSyncTimestamp(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SYNC_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/** Storage key constant for testing */
export const SYNC_STORAGE_KEY_EXPORT = SYNC_STORAGE_KEY;
