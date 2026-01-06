/**
 * useUpdateEvidence Hook
 *
 * TanStack Query mutation for updating evidence with optimistic UI.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOfflineGuard, isOfflineError } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import type { Evidence, UpdateEvidenceInput } from '@/types/evidence';

interface UpdateEvidenceVariables {
  id: string;
  updates: UpdateEvidenceInput;
}

/**
 * Hook for updating evidence with optimistic updates.
 *
 * @param questionId - Question ID for cache invalidation
 */
export function useUpdateEvidence(questionId: string) {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateEvidenceVariables) => {
      return evidenceRepo.update(id, updates);
    },

    // Optimistic update
    onMutate: async ({ id, updates }) => {
      // Check offline status FIRST before any async operations
      // This prevents mutation from getting stuck on cancelQueries when offline
      guardOffline(); // Throws OfflineError if offline

      const queryKey = queryKeys.evidence.byQuestion(questionId);
      await queryClient.cancelQueries({ queryKey });

      const previousEvidence =
        queryClient.getQueryData<Evidence[]>(queryKey) ?? [];

      // Update the specific evidence item
      const updatedEvidence = previousEvidence.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      queryClient.setQueryData(queryKey, updatedEvidence);

      return { previousEvidence };
    },

    // Rollback on error
    onError: (error, _variables, context) => {
      if (context?.previousEvidence) {
        queryClient.setQueryData(
          queryKeys.evidence.byQuestion(questionId),
          context.previousEvidence
        );
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to update evidence', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success toast
    onSuccess: () => {
      toast.success('Evidence updated');
    },

    // Always invalidate to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.evidence.byQuestion(questionId),
      });
    },
  });
}
