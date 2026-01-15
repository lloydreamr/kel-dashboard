'use client';

/**
 * useConflictResolution Hook
 *
 * React hook for managing sync conflict resolution.
 * Subscribes to sync engine conflict state and provides resolution functions.
 *
 * Features:
 * - Polls sync engine for conflict state
 * - Provides resolve function that handles resolution + cache invalidation
 * - Tracks isResolving state during async resolution
 * - Auto-refreshes after resolution via TanStack Query invalidation
 *
 * @see Story 8.4: AC2 - ConflictDialog Display
 * @see Story 8.4: AC3 - User Resolution Options
 */

import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

import { useProfile } from '@/hooks/auth/useProfile';
import { FEATURES } from '@/lib/features';
import { queryKeys } from '@/lib/queryKeys';
import {
  getSyncStatus,
  resolveConflict,
  clearConflictAndResume,
} from '@/lib/sync';

import type { ConflictData, ConflictResolution } from '@/lib/sync';

/**
 * Result from useConflictResolution hook.
 */
export interface UseConflictResolutionResult {
  /** Current conflict, or null if no conflict */
  conflict: ConflictData | null;
  /** Whether a resolution is currently in progress */
  isResolving: boolean;
  /** Function to resolve the conflict with a given resolution */
  resolve: (resolution: ConflictResolution) => Promise<void>;
}

/**
 * Polling interval for checking sync engine state (in ms).
 * Short interval ensures responsive UI when conflicts are detected.
 */
const POLL_INTERVAL_MS = 500;

/**
 * Hook for managing sync conflict resolution.
 *
 * Subscribes to sync engine state via polling (since sync engine uses
 * globalThis pattern, not React state). Provides a resolve function
 * that handles the resolution and cache invalidation.
 *
 * @returns Conflict state and resolution functions
 *
 * @example
 * ```tsx
 * function ConflictHandler() {
 *   const { conflict, isResolving, resolve } = useConflictResolution();
 *
 *   return (
 *     <ConflictDialog
 *       conflict={conflict}
 *       isResolving={isResolving}
 *       onResolve={resolve}
 *     />
 *   );
 * }
 * ```
 */
export function useConflictResolution(): UseConflictResolutionResult {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [conflict, setConflict] = useState<ConflictData | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Poll sync engine state for conflicts
  useEffect(() => {
    // Skip if feature disabled
    if (!FEATURES.OFFLINE_MODE) {
      return;
    }

    // Initial check
    const status = getSyncStatus();
    setConflict(status.currentConflict);

    // Set up polling
    const intervalId = setInterval(() => {
      const currentStatus = getSyncStatus();
      setConflict(currentStatus.currentConflict);
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  /**
   * Resolves the current conflict with the given resolution.
   * Handles:
   * 1. Calling resolveConflict to apply the resolution
   * 2. Clearing the conflict from sync engine
   * 3. Invalidating TanStack Query cache
   * 4. Resuming sync
   */
  const resolve = useCallback(
    async (resolution: ConflictResolution) => {
      if (!conflict || isResolving || !profile?.id) {
        console.warn('[useConflictResolution] Cannot resolve: no conflict, already resolving, or no profile');
        return;
      }

      setIsResolving(true);

      try {
        // Apply the resolution
        await resolveConflict(conflict, resolution, profile.id);

        // Invalidate queries for the affected question
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.questions.detail(conflict.questionId),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.decisions.byQuestion(conflict.questionId),
          }),
        ]);

        // Clear conflict and resume sync
        clearConflictAndResume(queryClient);

        // Update local state
        setConflict(null);

        console.log('[useConflictResolution] Conflict resolved:', resolution);
      } catch (error) {
        console.error('[useConflictResolution] Failed to resolve conflict:', error);
        // Don't clear conflict on error - let user try again
      } finally {
        setIsResolving(false);
      }
    },
    [conflict, isResolving, profile?.id, queryClient]
  );

  return {
    conflict,
    isResolving,
    resolve,
  };
}
