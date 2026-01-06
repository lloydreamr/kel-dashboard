'use client';

/**
 * useManualRefresh Hook
 *
 * Wraps a refresh function with loading state and sync time updates.
 * Handles offline detection and prevents concurrent refresh calls.
 *
 * Story 10.4: Offline Detection & Sync Indicator (Task 3)
 *
 * @example
 * ```tsx
 * const { refresh, isRefreshing } = useManualRefresh(async () => {
 *   await queryClient.invalidateQueries(['questions']);
 * });
 *
 * <Button onClick={refresh} disabled={isRefreshing}>
 *   {isRefreshing ? 'Refreshing...' : 'Refresh'}
 * </Button>
 * ```
 */

import { useState, useCallback, useRef } from 'react';

import { useOnlineStatus } from './useOnlineStatus';
import { useSyncStatus } from './useSyncStatus';

export interface UseManualRefreshResult {
  /** Trigger a manual refresh. Returns a Promise that resolves when done. */
  refresh: () => Promise<void>;
  /** True while refresh is in progress */
  isRefreshing: boolean;
}

/**
 * Hook for manual data refresh with sync tracking.
 *
 * Features:
 * - Tracks loading state during refresh
 * - Updates sync timestamp on successful refresh
 * - Prevents refresh when offline
 * - Prevents concurrent refresh calls
 * - Propagates errors from refresh function
 *
 * @param refreshFn - Async function to call for refreshing data
 */
export function useManualRefresh(
  refreshFn: () => Promise<void>
): UseManualRefreshResult {
  const { isOnline } = useOnlineStatus();
  const { updateSyncTime } = useSyncStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    // Don't refresh if offline
    if (!isOnline) {
      return;
    }

    // Prevent concurrent refresh calls
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      await refreshFn();
      // Only update sync time on success
      updateSyncTime();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [isOnline, refreshFn, updateSyncTime]);

  return {
    refresh,
    isRefreshing,
  };
}
