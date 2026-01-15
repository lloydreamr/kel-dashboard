/**
 * TypeScript types and constants for the sync engine.
 * Used by sync engine core, processor, and backoff utilities.
 *
 * @see Story 8.3: Sync Engine
 * @see Story 8.4: Conflict Detection & Resolution
 */

import type { OfflineAction } from '@/lib/offline/types';
import type { Question } from '@/types/question';

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
 * - conflict: Server data changed since offline action was created
 *
 * @see Story 8.4: Added 'conflict' result type
 */
export type SyncResult = 'success' | 'retry' | 'failed' | 'conflict';

/**
 * Current state of the sync engine.
 * Exposed via getSyncStatus() for UI components.
 *
 * @see Story 8.4: Added currentConflict field
 */
export interface SyncEngineState {
  /** Current engine status */
  status: SyncEngineStatus;
  /** Currently processing action (if syncing) */
  currentAction: OfflineAction | null;
  /** Current unresolved conflict (if detected) */
  currentConflict: ConflictData | null;
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

// ─────────────────────────────────────────────────────────────────────────────
// Conflict Detection & Resolution Types (Story 8.4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Data representing a detected conflict between offline action and server state.
 *
 * A conflict occurs when the server's question was updated AFTER the offline
 * action was created (server's `updated_at` > action's `createdAt`).
 *
 * @see Story 8.4: Conflict Detection & Resolution
 */
export interface ConflictData {
  /** Current server state of the question */
  serverState: Question;
  /** The offline action that conflicts with server state */
  offlineAction: OfflineAction;
  /** The question ID involved in the conflict */
  questionId: string;
}

/**
 * User's choice for resolving a conflict.
 *
 * - keep-mine: Force update server with offline decision (user's offline action wins)
 * - keep-server: Discard offline action, display current server data (server wins)
 * - cancel: Leave conflict unresolved, action stays in queue as pending
 *
 * @see Story 8.4: AC3 - User Resolution Options
 */
export type ConflictResolution = 'keep-mine' | 'keep-server' | 'cancel';

/**
 * Conflict resolution configuration constants.
 */
export const CONFLICT_CONFIG = {
  /** Timeout in milliseconds before auto-selecting server wins (30 seconds) */
  AUTO_RESOLVE_TIMEOUT_MS: 30000,
  /** Default resolution when timeout expires (server-wins per AR5) */
  DEFAULT_RESOLUTION: 'keep-server' as ConflictResolution,
} as const;

/**
 * Type for conflict configuration values.
 */
export type ConflictConfig = typeof CONFLICT_CONFIG;
