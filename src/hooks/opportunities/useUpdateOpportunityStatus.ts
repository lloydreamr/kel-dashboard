/**
 * useUpdateOpportunityStatus Hook
 *
 * TanStack Query mutation hook for updating opportunity status.
 * When status is 'actionable', also sets reviewed_at timestamp.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import {
  opportunitiesRepo,
  type Opportunity,
  type OpportunityStatus,
} from '@/lib/repositories/opportunities';

/**
 * Mutation input for updating opportunity status
 */
export type UpdateOpportunityStatusInput = {
  id: string;
  status: OpportunityStatus;
};

/**
 * Hook for updating opportunity status.
 * When marking as 'actionable', also calls markReviewed to set reviewed_at timestamp.
 *
 * @returns Mutation for updating opportunity status
 *
 * @example
 * const { mutate, isPending } = useUpdateOpportunityStatus();
 * mutate({ id: opportunityId, status: 'actionable' });
 */
export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();

  return useMutation<Opportunity, Error, UpdateOpportunityStatusInput>({
    mutationFn: async ({ id, status }) => {
      // Update status first
      const updated = await opportunitiesRepo.updateStatus(id, status);

      // Set reviewed_at when marking as actionable (AC6)
      // Wrap in try-catch to ensure status update isn't lost if markReviewed fails
      if (status === 'actionable') {
        try {
          return await opportunitiesRepo.markReviewed(id);
        } catch (error) {
          // Log but don't fail - status was already updated
          console.error('Failed to set reviewed timestamp:', error);
          return updated;
        }
      }

      return updated;
    },
    onSuccess: (_, { id }) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.byId(id) });
    },
    onError: (error) => {
      toast.error('Failed to update opportunity', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
