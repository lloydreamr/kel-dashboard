/**
 * Sync engine core - processes offline queue when online.
 *
 * Responsibilities:
 * - Processes queue items FIFO when online
 * - Implements retry with exponential backoff
 * - Updates action status throughout sync process
 * - Triggers TanStack Query cache invalidation on success
 * - Handles max retry limit (marks as failed after 3 attempts)
 * - Pauses sync when conflicts detected, waits for resolution
 *
 * Uses globalThis pattern for HMR safety (like db.ts from Story 8.2).
 *
 * @see Story 8.3: Sync Engine - Task 4
 * @see Story 8.4: Conflict Detection integration
 */

import { FEATURES } from '@/lib/features';
import { deleteById, getAll, getCount, peek, updateStatus } from '@/lib/offline';
import { queryKeys } from '@/lib/queryKeys';

import { calculateBackoffDelay } from './backoff';
import { processAction } from './processor';
import { SYNC_CONFIG } from './types';

import type { QueryClient } from '@tanstack/react-query';
import type { SyncEngineState } from './types';

/**
 * Global state storage for HMR safety.
 * Ensures sync engine state persists across hot module reloads.
 */
const globalForSync = globalThis as unknown as {
  syncEngineState: SyncEngineState | undefined;
  syncTimeoutId: ReturnType<typeof setTimeout> | undefined;
};

/**
 * Initial sync engine state.
 */
const INITIAL_STATE: SyncEngineState = {
  status: 'idle',
  currentAction: null,
  currentConflict: null,
  lastSyncAt: null,
  pendingCount: 0,
  failedCount: 0,
};

/**
 * Current sync engine state.
 * Restored from globalThis if available (HMR).
 */
let state: SyncEngineState = globalForSync.syncEngineState ?? { ...INITIAL_STATE };

/**
 * Timeout ID for scheduled retries.
 * Restored from globalThis if available (HMR).
 */
let timeoutId: ReturnType<typeof setTimeout> | undefined =
  globalForSync.syncTimeoutId;

/**
 * Updates internal state and persists to globalThis.
 */
function setState(updates: Partial<SyncEngineState>): void {
  state = { ...state, ...updates };
  globalForSync.syncEngineState = state;
}

/**
 * Sets the retry timeout and persists to globalThis.
 */
function setTimeoutId(id: ReturnType<typeof setTimeout> | undefined): void {
  timeoutId = id;
  globalForSync.syncTimeoutId = id;
}

/**
 * Invalidates TanStack Query cache after successful sync.
 *
 * Invalidates:
 * - questions.all - refresh question list
 * - questions.detail(questionId) - refresh specific question
 * - decisions.byQuestion(questionId) - refresh decision for question
 *
 * @param queryClient - TanStack Query client
 * @param questionId - ID of question whose decision was synced
 */
async function invalidateCache(
  queryClient: QueryClient,
  questionId: string
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.questions.detail(questionId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.decisions.byQuestion(questionId),
    }),
  ]);
}

/**
 * Updates pending and failed counts from queue state.
 */
async function updateCounts(): Promise<void> {
  const pendingCount = await getCount();
  const allActions = await getAll();
  const failedCount = allActions.filter((a) => a.status === 'failed').length;
  setState({ pendingCount, failedCount });
}

/**
 * Processes the offline queue FIFO.
 * Continues until queue is empty, offline, or stopped.
 *
 * Uses peek() + process + dequeue() pattern:
 * - peek() gets oldest pending without removing
 * - On success: dequeue() removes it
 * - On retry: updateStatus() increments retry count, stays in queue
 * - On failed: updateStatus() marks as failed
 *
 * @param queryClient - TanStack Query client for cache invalidation
 */
async function processQueue(queryClient: QueryClient): Promise<void> {
  while (navigator.onLine && state.status === 'syncing') {
    // Peek next pending action (FIFO) - does NOT remove from queue
    const action = await peek();

    if (!action) {
      // Queue empty - sync complete
      setState({
        status: 'idle',
        currentAction: null,
        lastSyncAt: Date.now(),
      });
      await updateCounts();
      return;
    }

    // Update state with current action
    setState({ currentAction: action });

    // Mark as syncing in queue
    if (action.id !== undefined) {
      await updateStatus(action.id, 'syncing');
    }

    // Process the action
    const { result, conflict } = await processAction(action);

    if (result === 'success') {
      // Action synced successfully
      // Remove the specific action we just processed (by ID to avoid race conditions)
      if (action.id !== undefined) {
        await deleteById(action.id);
      }

      // Invalidate cache
      await invalidateCache(queryClient, action.payload.questionId);
    } else if (result === 'conflict') {
      // Conflict detected - pause sync and wait for user resolution
      // Mark action back to pending (it's not failed, just waiting)
      if (action.id !== undefined) {
        await updateStatus(action.id, 'pending', action.retryCount, 'Conflict detected');
      }

      setState({
        status: 'paused',
        currentAction: null,
        currentConflict: conflict,
      });

      console.log(
        `[sync/engine] Sync paused due to conflict for question ${action.payload.questionId}`
      );

      await updateCounts();
      return; // Exit loop, wait for conflict resolution
    } else if (result === 'retry') {
      // Network error - check retry limit
      const newRetryCount = action.retryCount + 1;

      if (newRetryCount < SYNC_CONFIG.MAX_RETRIES) {
        // Update status back to pending with incremented retry count
        if (action.id !== undefined) {
          await updateStatus(action.id, 'pending', newRetryCount, 'Network error');
        }

        // Calculate backoff delay
        const delay = calculateBackoffDelay(action.retryCount);

        console.log(
          `[sync/engine] Scheduling retry in ${Math.round(delay)}ms (attempt ${newRetryCount}/${SYNC_CONFIG.MAX_RETRIES})`
        );

        setState({ status: 'idle', currentAction: null });

        // Schedule retry
        const newTimeoutId = setTimeout(() => {
          startSync(queryClient);
        }, delay);
        setTimeoutId(newTimeoutId);

        await updateCounts();
        return; // Exit loop, will retry later
      } else {
        // Max retries exceeded - mark as failed
        if (action.id !== undefined) {
          await updateStatus(action.id, 'failed', newRetryCount, 'Max retries exceeded');
        }

        console.error(
          `[sync/engine] Max retries (${SYNC_CONFIG.MAX_RETRIES}) exceeded for action ${action.id}`
        );
      }
    } else {
      // Permanent failure - mark as failed
      if (action.id !== undefined) {
        await updateStatus(action.id, 'failed', action.retryCount, 'Permanent failure');
      }
    }

    // Update counts after processing
    await updateCounts();
  }

  // If we exit because we went offline, pause
  if (!navigator.onLine && state.status === 'syncing') {
    setState({ status: 'paused', currentAction: null });
  }
}

/**
 * Starts the sync engine to process the offline queue.
 *
 * Guards:
 * - Returns early if OFFLINE_MODE feature is disabled
 * - Returns early if already offline
 * - Returns early if already syncing
 *
 * @param queryClient - TanStack Query client for cache invalidation
 *
 * @example
 * ```typescript
 * import { startSync } from '@/lib/sync';
 *
 * // In online event handler:
 * window.addEventListener('online', () => {
 *   startSync(queryClient);
 * });
 * ```
 */
export async function startSync(queryClient: QueryClient): Promise<void> {
  // Guard: Feature flag check
  if (!FEATURES.OFFLINE_MODE) {
    return;
  }

  // Guard: Must be online
  if (!navigator.onLine) {
    console.log('[sync/engine] Cannot start sync - offline');
    return;
  }

  // Guard: Don't start if already syncing
  if (state.status === 'syncing') {
    console.log('[sync/engine] Sync already in progress');
    return;
  }

  console.log('[sync/engine] Starting sync...');
  setState({ status: 'syncing' });
  await updateCounts();

  try {
    await processQueue(queryClient);
  } catch (error) {
    console.error('[sync/engine] Unexpected error during sync:', error);
    setState({ status: 'idle', currentAction: null });
  }
}

/**
 * Stops the sync engine and cancels any pending retries.
 *
 * @example
 * ```typescript
 * import { stopSync } from '@/lib/sync';
 *
 * // Stop sync before logout
 * stopSync();
 * ```
 */
export function stopSync(): void {
  // Cancel any scheduled retry
  if (timeoutId) {
    clearTimeout(timeoutId);
    setTimeoutId(undefined);
  }

  // Reset state
  setState({ status: 'idle', currentAction: null });

  console.log('[sync/engine] Sync stopped');
}

/**
 * Gets the current sync engine status.
 *
 * @returns Current sync engine state (copy, not reference)
 *
 * @example
 * ```typescript
 * import { getSyncStatus } from '@/lib/sync';
 *
 * const status = getSyncStatus();
 * if (status.status === 'syncing') {
 *   showSyncingIndicator();
 * }
 * ```
 */
export function getSyncStatus(): SyncEngineState {
  return { ...state };
}

/**
 * Clears the current conflict and resumes sync.
 * Called after conflict resolution (user made a choice or timeout).
 *
 * @param queryClient - TanStack Query client for cache invalidation
 *
 * @example
 * ```typescript
 * import { clearConflictAndResume } from '@/lib/sync';
 *
 * // After resolving conflict:
 * await resolveConflict(conflict, 'keep-server', profileId);
 * clearConflictAndResume(queryClient);
 * ```
 *
 * @see Story 8.4: AC3 - User Resolution Options
 */
export function clearConflictAndResume(queryClient: QueryClient): void {
  // Clear conflict state
  setState({ currentConflict: null });

  // Resume sync (will pick up from queue)
  startSync(queryClient);

  console.log('[sync/engine] Conflict cleared, resuming sync');
}
