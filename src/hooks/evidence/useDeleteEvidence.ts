/**
 * useDeleteEvidence Hook
 *
 * TanStack Query mutation for deleting evidence with optimistic UI.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import type { Evidence } from '@/types/evidence';

/**
 * Hook for deleting evidence with optimistic updates.
 *
 * @param questionId - Question ID for cache invalidation
 */
export function useDeleteEvidence(questionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => evidenceRepo.delete(id),

    // Optimistic update: Remove from list immediately
    onMutate: async (id: string) => {
      const queryKey = queryKeys.evidence.byQuestion(questionId);
      await queryClient.cancelQueries({ queryKey });

      const previousEvidence =
        queryClient.getQueryData<Evidence[]>(queryKey) ?? [];

      // Filter out the deleted item
      const updatedEvidence = previousEvidence.filter((item) => item.id !== id);
      queryClient.setQueryData(queryKey, updatedEvidence);

      return { previousEvidence };
    },

    // Rollback on error
    onError: (error, _id, context) => {
      if (context?.previousEvidence) {
        queryClient.setQueryData(
          queryKeys.evidence.byQuestion(questionId),
          context.previousEvidence
        );
      }
      toast.error('Failed to remove evidence', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success toast
    onSuccess: () => {
      toast.success('Evidence removed');
    },

    // Always invalidate to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.evidence.byQuestion(questionId),
      });
    },
  });
}
