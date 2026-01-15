/**
 * TypeScript types and constants for the sync engine.
 * Used by sync engine core, processor, and backoff utilities.
 *
 * @see Story 8.3: Sync Engine
 */

import type { OfflineAction } from '@/lib/offline/types';

/**
 * Status of the sync engine.
 *
 * - idle: Not currently syncing, waiting for trigger
 * - syncing: Actively processing queue items
 * - paused: Temporarily stopped (e.g., went offline)
 */
export type SyncEngineStatus = 'idle' | 'syncing' | 'paused';

/**
 * Result of processing a single offline action.
 *
 * - success: Action synced successfully to server
 * - retry: Network error, should retry with backoff
 * - failed: Permanent error, should not retry
 */
export type SyncResult = 'success' | 'retry' | 'failed';

/**
 * Current state of the sync engine.
 * Exposed via getSyncStatus() for UI components.
 */
export interface SyncEngineState {
  /** Current engine status */
  status: SyncEngineStatus;
  /** Currently processing action (if syncing) */
  currentAction: OfflineAction | null;
  /** Timestamp of last successful sync completion */
  lastSyncAt: number | null;
  /** Count of pending actions in queue */
  pendingCount: number;
  /** Count of failed actions (max retries exceeded) */
  failedCount: number;
}

/**
 * Sync engine configuration constants.
 * Used for retry logic with exponential backoff.
 */
export const SYNC_CONFIG = {
  /** Maximum number of retry attempts before marking as failed */
  MAX_RETRIES: 3,
  /** Base delay in milliseconds for first retry (1 second) */
  BASE_DELAY_MS: 1000,
  /** Maximum delay cap in milliseconds (30 seconds) */
  MAX_DELAY_MS: 30000,
  /** Random jitter range to prevent thundering herd (0-1000ms) */
  JITTER_MS: 1000,
} as const;

/**
 * Type for sync configuration values.
 */
export type SyncConfig = typeof SYNC_CONFIG;
