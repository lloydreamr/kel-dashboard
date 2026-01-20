/**
 * TypeScript types for the offline action queue.
 * Used by IndexedDB storage and sync engine.
 *
 * @see Story 8.2: IndexedDB Offline Queue
 */

import type { DBSchema } from 'idb';

/**
 * Types of actions that can be queued for offline sync.
 * These map directly to decision actions in the app.
 */
export type ActionType =
  | 'approve'
  | 'approve_with_constraint'
  | 'explore_alternatives';

/**
 * Status of an offline action in the sync process.
 *
 * - pending: Waiting to be synced
 * - syncing: Currently being sent to server
 * - failed: Sync attempt failed (will retry)
 */
export type ActionStatus = 'pending' | 'syncing' | 'failed';

/**
 * Payload data for offline actions.
 * Contains all information needed to replay the action on sync.
 */
export interface ActionPayload {
  /** The question ID the decision applies to */
  questionId: string;
  /** Constraints for approve_with_constraint action */
  constraints?: Array<{ type: string; context?: string }>;
  /** Additional context for constraints */
  constraintContext?: string;
  /** Reasoning for explore_alternatives action */
  reasoning?: string;
  /** User ID who created the action */
  createdBy: string;
}

/**
 * An offline action stored in IndexedDB.
 * Represents a user decision made while offline.
 */
export interface OfflineAction {
  /** Auto-generated ID by IndexedDB (omit when creating) */
  id?: number;
  /** The type of action to perform */
  action: ActionType;
  /** Action-specific data */
  payload: ActionPayload;
  /** Timestamp when action was created (for FIFO ordering) */
  createdAt: number;
  /** Current sync status */
  status: ActionStatus;
  /** Number of sync retry attempts */
  retryCount: number;
  /** Error message from last failed sync attempt */
  lastError?: string;
}

/**
 * IndexedDB schema for type-safe database operations.
 * Used with idb library's openDB function.
 */
export interface KelDB extends DBSchema {
  'offline-queue': {
    key: number;
    value: OfflineAction;
    indexes: {
      'by-status': ActionStatus;
      'by-created': number;
    };
  };
}

/**
 * Database configuration constants.
 */
export const DB_CONFIG = {
  /** Database name */
  NAME: 'kel-dashboard',
  /** Current schema version */
  VERSION: 1,
  /** Store name for offline queue */
  STORE_NAME: 'offline-queue',
} as const;
