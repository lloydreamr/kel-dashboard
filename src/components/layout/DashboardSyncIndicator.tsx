'use client';

/**
 * DashboardSyncIndicator Component
 *
 * Wrapper around SyncIndicator that integrates with TanStack Query.
 * Provides refresh functionality to invalidate all dashboard queries.
 *
 * Story 10.4: Offline Detection & Sync Indicator (Task 5)
 *
 * @example
 * ```tsx
 * // In layout or header:
 * <DashboardSyncIndicator />
 * ```
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { SyncIndicator } from '@/components/offline';
import { useManualRefresh } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';

export interface DashboardSyncIndicatorProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * DashboardSyncIndicator - SyncIndicator with query refresh functionality.
 *
 * When refresh button is clicked:
 * 1. Invalidates all major query caches (questions, evidence, decisions, etc.)
 * 2. Updates sync timestamp on successful refresh
 * 3. Shows loading state during refresh
 */
export function DashboardSyncIndicator({
  className,
}: DashboardSyncIndicatorProps) {
  const queryClient = useQueryClient();

  const refreshQueries = useCallback(async () => {
    // Invalidate all major queries in parallel
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.decisions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.competitors.all }),
    ]);
  }, [queryClient]);

  const { refresh, isRefreshing } = useManualRefresh(refreshQueries);

  // Custom refresh handler that wraps the hook's refresh
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Pass isRefreshing state to control the spinner
  // The SyncIndicator manages its own isRefreshing state, but we could
  // extend it to accept external state if needed for finer control
  return (
    <SyncIndicator
      onRefresh={handleRefresh}
      className={className}
    />
  );
}
