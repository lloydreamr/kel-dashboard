/**
 * Offline action queue operations.
 * Provides CRUD operations for managing offline actions in IndexedDB.
 *
 * All functions:
 * - Check FEATURES.OFFLINE_MODE before executing
 * - Return null/empty on errors (graceful degradation)
 * - Are async (Promise-based)
 *
 * @see Story 8.2: IndexedDB Offline Queue
 */

import { FEATURES } from '@/lib/features';

import { openDatabase } from './db';
import { DB_CONFIG } from './types';

import type { ActionPayload, ActionStatus, ActionType, OfflineAction } from './types';

/**
 * Adds a new action to the offline queue.
 *
 * @param action - The type of action (approve, approve_with_constraint, explore_alternatives)
 * @param payload - Action-specific data (questionId, constraints, etc.)
 * @returns The auto-generated ID of the new action, or null if failed/disabled
 *
 * @example
 * ```typescript
 * const id = await enqueue('approve', {
 *   questionId: 'q1',
 *   createdBy: 'user1',
 * });
 * ```
 */
export async function enqueue(
  action: ActionType,
  payload: ActionPayload
): Promise<number | null> {
  if (!FEATURES.OFFLINE_MODE) return null;

  try {
    const db = await openDatabase();
    if (!db) return null;

    const offlineAction: Omit<OfflineAction, 'id'> = {
      action,
      payload,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    const id = await db.add(DB_CONFIG.STORE_NAME, offlineAction as OfflineAction);
    return id;
  } catch (error) {
    console.error('[offline/queue] Enqueue failed:', error);
    return null;
  }
}

/**
 * Removes and returns the oldest pending action from the queue (FIFO).
 *
 * Uses by-status index to efficiently find pending actions, then selects
 * the one with the oldest createdAt timestamp.
 *
 * @returns The oldest pending action, or null if queue is empty/disabled
 *
 * @example
 * ```typescript
 * const action = await dequeue();
 * if (action) {
 *   await syncAction(action);
 * }
 * ```
 */
export async function dequeue(): Promise<OfflineAction | null> {
  if (!FEATURES.OFFLINE_MODE) return null;

  try {
    const db = await openDatabase();
    if (!db) return null;

    const tx = db.transaction(DB_CONFIG.STORE_NAME, 'readwrite');

    // Get all pending actions using the by-status index (efficient filtering)
    const pendingActions = await tx.store.index('by-status').getAll('pending');

    if (pendingActions.length === 0) {
      await tx.done;
      return null;
    }

    // Find the oldest by createdAt (FIFO)
    const oldest = pendingActions.reduce((min, action) =>
      action.createdAt < min.createdAt ? action : min
    );

    // Delete the oldest action
    await tx.store.delete(oldest.id!);
    await tx.done;

    return oldest;
  } catch (error) {
    console.error('[offline/queue] Dequeue failed:', error);
    return null;
  }
}

/**
 * Returns the oldest pending action without removing it.
 *
 * Uses by-status index to efficiently find pending actions, then selects
 * the one with the oldest createdAt timestamp.
 *
 * @returns The oldest pending action, or null if queue is empty/disabled
 *
 * @example
 * ```typescript
 * const next = await peek();
 * if (next) {
 *   console.log('Next action to sync:', next.action);
 * }
 * ```
 */
export async function peek(): Promise<OfflineAction | null> {
  if (!FEATURES.OFFLINE_MODE) return null;

  try {
    const db = await openDatabase();
    if (!db) return null;

    // Get all pending actions using the by-status index (efficient filtering)
    const pendingActions = await db.getAllFromIndex(
      DB_CONFIG.STORE_NAME,
      'by-status',
      'pending'
    );

    if (pendingActions.length === 0) {
      return null;
    }

    // Find the oldest by createdAt (FIFO)
    return pendingActions.reduce((min, action) =>
      action.createdAt < min.createdAt ? action : min
    );
  } catch (error) {
    console.error('[offline/queue] Peek failed:', error);
    return null;
  }
}

/**
 * Removes all actions from the queue.
 *
 * @returns True if cleared successfully, false if failed/disabled
 *
 * @example
 * ```typescript
 * await clear(); // Remove all queued actions
 * ```
 */
export async function clear(): Promise<boolean> {
  if (!FEATURES.OFFLINE_MODE) return false;

  try {
    const db = await openDatabase();
    if (!db) return false;

    await db.clear(DB_CONFIG.STORE_NAME);
    return true;
  } catch (error) {
    console.error('[offline/queue] Clear failed:', error);
    return false;
  }
}

/**
 * Returns all actions in the queue (all statuses).
 * Useful for debugging and displaying queue contents.
 *
 * @returns Array of all actions, or empty array if failed/disabled
 *
 * @example
 * ```typescript
 * const actions = await getAll();
 * console.log(`Queue has ${actions.length} actions`);
 * ```
 */
export async function getAll(): Promise<OfflineAction[]> {
  if (!FEATURES.OFFLINE_MODE) return [];

  try {
    const db = await openDatabase();
    if (!db) return [];

    return await db.getAll(DB_CONFIG.STORE_NAME);
  } catch (error) {
    console.error('[offline/queue] GetAll failed:', error);
    return [];
  }
}

/**
 * Returns only pending actions from the queue.
 *
 * @returns Array of pending actions, or empty array if failed/disabled
 *
 * @example
 * ```typescript
 * const pending = await getAllPending();
 * console.log(`${pending.length} actions waiting to sync`);
 * ```
 */
export async function getAllPending(): Promise<OfflineAction[]> {
  if (!FEATURES.OFFLINE_MODE) return [];

  try {
    const db = await openDatabase();
    if (!db) return [];

    return await db.getAllFromIndex(DB_CONFIG.STORE_NAME, 'by-status', 'pending');
  } catch (error) {
    console.error('[offline/queue] GetAllPending failed:', error);
    return [];
  }
}

/**
 * Updates the status and retry count of an action.
 * Used by sync engine to track sync progress.
 *
 * @param id - The action ID to update
 * @param status - New status (pending, syncing, failed)
 * @param retryCount - Optional updated retry count
 * @param lastError - Optional error message from failed sync
 * @returns True if updated successfully, false if failed/disabled
 *
 * @example
 * ```typescript
 * // Mark action as syncing
 * await updateStatus(action.id, 'syncing');
 *
 * // Mark action as failed with error
 * await updateStatus(action.id, 'failed', action.retryCount + 1, 'Network error');
 * ```
 */
export async function updateStatus(
  id: number,
  status: ActionStatus,
  retryCount?: number,
  lastError?: string
): Promise<boolean> {
  if (!FEATURES.OFFLINE_MODE) return false;

  try {
    const db = await openDatabase();
    if (!db) return false;

    const tx = db.transaction(DB_CONFIG.STORE_NAME, 'readwrite');
    const action = await tx.store.get(id);

    if (!action) {
      await tx.done;
      return false;
    }

    const updatedAction: OfflineAction = {
      ...action,
      status,
      ...(retryCount !== undefined && { retryCount }),
      ...(lastError !== undefined && { lastError }),
    };

    await tx.store.put(updatedAction);
    await tx.done;
    return true;
  } catch (error) {
    console.error('[offline/queue] UpdateStatus failed:', error);
    return false;
  }
}

/**
 * Returns the count of pending actions in the queue.
 *
 * @returns Number of pending actions, or 0 if failed/disabled
 *
 * @example
 * ```typescript
 * const count = await getCount();
 * if (count > 0) {
 *   showPendingSyncBadge(count);
 * }
 * ```
 */
export async function getCount(): Promise<number> {
  if (!FEATURES.OFFLINE_MODE) return 0;

  try {
    const db = await openDatabase();
    if (!db) return 0;

    return await db.countFromIndex(DB_CONFIG.STORE_NAME, 'by-status', 'pending');
  } catch (error) {
    console.error('[offline/queue] GetCount failed:', error);
    return 0;
  }
}

/**
 * Deletes a specific action by ID.
 * Used by sync engine after successfully processing a peeked action.
 *
 * This is preferred over dequeue() when you have a specific action ID,
 * as it avoids race conditions where a different action might be dequeued.
 *
 * @param id - The action ID to delete
 * @returns True if deleted successfully, false if not found/failed/disabled
 *
 * @example
 * ```typescript
 * const action = await peek();
 * if (action && action.id) {
 *   await processAction(action);
 *   await deleteById(action.id);  // Delete the specific action we processed
 * }
 * ```
 */
export async function deleteById(id: number): Promise<boolean> {
  if (!FEATURES.OFFLINE_MODE) return false;

  try {
    const db = await openDatabase();
    if (!db) return false;

    const tx = db.transaction(DB_CONFIG.STORE_NAME, 'readwrite');
    const action = await tx.store.get(id);

    if (!action) {
      await tx.done;
      return false;
    }

    await tx.store.delete(id);
    await tx.done;
    return true;
  } catch (error) {
    console.error('[offline/queue] DeleteById failed:', error);
    return false;
  }
}
