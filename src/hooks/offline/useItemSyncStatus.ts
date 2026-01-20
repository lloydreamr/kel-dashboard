'use client';

/**
 * useItemSyncStatus Hook
 *
 * Returns the sync status for a specific item in the offline queue.
 * Used by OfflineSyncIndicator to display per-item sync feedback.
 *
 * Status mapping:
 * - pending/syncing in queue → 'pending'
 * - failed in queue → 'retry'
 * - has conflict → 'conflict'
 * - not in queue → 'synced' (already synced and removed)
 *
 * @see Story 8.6: Full Sync Status Indicators
 */

import { useState, useEffect, useCallback } from 'react';

import { FEATURES } from '@/lib/features';
import { getAll } from '@/lib/offline';

import type { OfflineSyncStatus } from '@/components/offline/OfflineSyncIndicator';
import type { ActionStatus, OfflineAction } from '@/lib/offline';

export interface UseItemSyncStatusResult {
  /** Current sync status, or null if feature disabled or no actionId */
  status: OfflineSyncStatus | null;
  /** Whether the hook is loading data */
  isLoading: boolean;
}

/**
 * Maps queue ActionStatus to OfflineSyncStatus.
 *
 * @param queueStatus - Status from the offline queue
 * @param hasConflict - Whether a conflict has been detected for this item
 * @returns The OfflineSyncStatus to display
 */
function mapQueueStatusToIndicator(
  queueStatus: ActionStatus | undefined,
  hasConflict: boolean
): OfflineSyncStatus {
  // Conflict takes priority
  if (hasConflict) {
    return 'conflict';
  }

  // Map queue status to indicator status
  switch (queueStatus) {
    case 'pending':
    case 'syncing':
      return 'pending';
    case 'failed':
      return 'retry';
    case undefined:
      // Not in queue = already synced and removed
      return 'synced';
    default:
      return 'synced';
  }
}

/**
 * Custom event for queue changes.
 * Components can dispatch this to trigger status refresh.
 */
export const QUEUE_CHANGE_EVENT = 'kel:offline-queue-change';

/**
 * useItemSyncStatus - Get sync status for a specific offline action.
 *
 * Per Story 8.6 Acceptance Criteria:
 * - AC1: Returns status for items in queue (pending, retry, conflict)
 * - AC5: Feature flag guard - returns null status when disabled
 *
 * Per Story 8.6 Dev Notes:
 * - Hook structure follows pattern from Story 8.5
 * - Subscribes to queue changes via polling and custom events
 *
 * @param questionId - The question ID to check status for
 * @returns Object with status and loading state
 *
 * @example
 * ```tsx
 * const { status, isLoading } = useItemSyncStatus('question-123');
 *
 * if (!status) return null; // Feature disabled
 * return <OfflineSyncIndicator status={status} />;
 * ```
 */
export function useItemSyncStatus(questionId: string | null): UseItemSyncStatusResult {
  const [status, setStatus] = useState<OfflineSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Feature flag guard - return early if disabled
  const isEnabled = FEATURES.OFFLINE_MODE && questionId !== null;

  const checkStatus = useCallback(async () => {
    if (!isEnabled) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      // Get all actions from queue
      const actions = await getAll();

      // Find actions for this question
      const matchingAction = actions.find(
        (action: OfflineAction) => action.payload.questionId === questionId
      );

      if (matchingAction) {
        // TODO: Check for conflict flag when conflict detection is integrated
        // For now, we check if lastError contains "conflict" as a heuristic
        const hasConflict = matchingAction.lastError?.toLowerCase().includes('conflict') ?? false;

        setStatus(mapQueueStatusToIndicator(matchingAction.status, hasConflict));
      } else {
        // Not in queue = synced
        setStatus('synced');
      }
    } catch {
      // On error, assume synced (graceful degradation per project patterns)
      console.error('[useItemSyncStatus] Failed to check queue status');
      setStatus('synced');
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, questionId]);

  // Initial check and polling
  useEffect(() => {
    if (!isEnabled) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    // Initial check
    checkStatus();

    // Poll every 2 seconds for queue changes
    // This is a simple approach; could be optimized with IndexedDB observers or events
    const intervalId = setInterval(checkStatus, 2000);

    // Listen for custom queue change events
    const handleQueueChange = () => {
      checkStatus();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(QUEUE_CHANGE_EVENT, handleQueueChange);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener(QUEUE_CHANGE_EVENT, handleQueueChange);
      }
    };
  }, [isEnabled, checkStatus]);

  // Return null status when feature disabled
  if (!FEATURES.OFFLINE_MODE || questionId === null) {
    return { status: null, isLoading: false };
  }

  return { status, isLoading };
}

/**
 * Utility function to dispatch queue change event.
 * Call this after modifying the offline queue to trigger status refresh.
 */
export function dispatchQueueChangeEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGE_EVENT));
  }
}
