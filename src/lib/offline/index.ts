/**
 * Offline queue module - public API.
 *
 * Exports types and queue operations for offline action management.
 * Database module (db.ts) is internal and not exported.
 *
 * @example
 * ```typescript
 * import { enqueue, getCount } from '@/lib/offline';
 * import type { OfflineAction, ActionType } from '@/lib/offline';
 *
 * // Queue an action
 * await enqueue('approve', { questionId: 'q1', createdBy: 'user1' });
 *
 * // Get pending count
 * const count = await getCount();
 * ```
 *
 * @see Story 8.2: IndexedDB Offline Queue
 */

// Types
export type {
  ActionPayload,
  ActionStatus,
  ActionType,
  KelDB,
  OfflineAction,
} from './types';

export { DB_CONFIG } from './types';

// Queue operations
export {
  clear,
  deleteById,
  dequeue,
  enqueue,
  getAll,
  getAllPending,
  getCount,
  peek,
  updateStatus,
} from './queue';
