/**
 * useUpdateMilestone Hook
 *
 * TanStack Query mutation hook for updating milestone status.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useOfflineGuard } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';
import { milestonesRepo } from '@/lib/repositories/milestones';

import type { MilestoneStatus } from '@/types/milestone';

/**
 * Hook for updating milestone status.
 * Automatically invalidates milestone queries on success.
 *
 * @returns Mutation result
 *
 * @example
 * const updateMilestone = useUpdateMilestone();
 * await updateMilestone.mutateAsync({ id: '...', status: 'in_progress' });
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MilestoneStatus }) => {
      guardOffline(); // Throws OfflineError if offline
      return milestonesRepo.updateStatus(id, status);
    },
    onSuccess: () => {
      // Invalidate all milestone queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
    },
  });
}

/**
 * Hook for marking a milestone as complete.
 * Automatically invalidates milestone queries on success.
 *
 * @returns Mutation result
 *
 * @example
 * const markComplete = useMarkMilestoneComplete();
 * await markComplete.mutateAsync({ id: '...', userId: '...' });
 */
export function useMarkMilestoneComplete() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => {
      guardOffline(); // Throws OfflineError if offline
      return milestonesRepo.markComplete(id, userId);
    },
    onSuccess: () => {
      // Invalidate all milestone queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
    },
  });
}
