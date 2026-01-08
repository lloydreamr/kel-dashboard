/**
 * useSyncOnQuerySuccess Hook
 *
 * Listens to TanStack Query cache events and updates sync timestamp
 * whenever a query successfully fetches data from the server.
 *
 * Story 10.4: Offline Detection & Sync Indicator (Task 6)
 *
 * @example
 * ```tsx
 * // In providers.tsx or a top-level component:
 * function AppEffects() {
 *   useSyncOnQuerySuccess();
 *   return null;
 * }
 * ```
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { FEATURES } from '@/lib/features';

import { useSyncStatus } from './useSyncStatus';

/**
 * Hook that updates sync timestamp when queries succeed.
 *
 * Uses QueryCache's subscribe method to listen for query state changes.
 * Only updates sync time when:
 * - OFFLINE_READ feature is enabled
 * - Query transitions from fetching to success
 * - It's a real network fetch (not cache hit)
 */
export function useSyncOnQuerySuccess(): void {
  const queryClient = useQueryClient();
  const { updateSyncTime } = useSyncStatus();

  useEffect(() => {
    // Skip if offline feature is disabled
    if (!FEATURES.OFFLINE_READ) {
      return;
    }

    const queryCache = queryClient.getQueryCache();

    // Subscribe to cache events
    const unsubscribe = queryCache.subscribe((event) => {
      // Only react to query updates
      if (event.type !== 'updated') {
        return;
      }

      const query = event.query;
      const action = event.action;

      // Check if this is a successful fetch (not from cache)
      // action.type === 'success' means data was fetched
      // We also check fetchStatus to ensure it was a real network request
      if (
        action.type === 'success' &&
        query.state.fetchStatus === 'idle' && // Fetch completed
        query.state.status === 'success' && // Query is successful
        query.state.dataUpdatedAt > 0 // Has fresh data
      ) {
        // Only update if this was a fresh fetch (not just a re-render)
        // Check if dataUpdatedAt is very recent (within 1 second)
        const now = Date.now();
        const dataAge = now - query.state.dataUpdatedAt;

        if (dataAge < 1000) {
          updateSyncTime();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, updateSyncTime]);
}
