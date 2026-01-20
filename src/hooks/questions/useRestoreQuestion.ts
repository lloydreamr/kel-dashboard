/**
 * useRestoreQuestion Hook
 *
 * TanStack Query mutation for restoring archived questions.
 * Moves a question from archived back to draft status.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOfflineGuard, isOfflineError } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Question } from '@/types/question';

/**
 * Hook for restoring an archived question with optimistic updates.
 *
 * Features:
 * - Optimistic UI: Removes from archived list immediately
 * - Auto-rollback on error
 * - Success toast with restore confirmation
 * - Invalidates both questions list and archived list
 *
 * @example
 * const { mutate: restoreQuestion, isPending } = useRestoreQuestion();
 * restoreQuestion('question-123');
 */
export function useRestoreQuestion() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: (id: string) => {
      return questionsRepo.restore(id);
    },

    // Optimistic update: Remove from archived list immediately
    onMutate: async (id: string) => {
      // Check offline status FIRST before any async operations
      // This prevents mutation from getting stuck on cancelQueries when offline
      guardOffline(); // Throws OfflineError if offline

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.questions.archived,
      });

      // Snapshot previous archived list
      const previousArchived = queryClient.getQueryData<Question[]>(
        queryKeys.questions.archived
      );

      // Optimistically remove from archived list
      if (previousArchived) {
        queryClient.setQueryData(
          queryKeys.questions.archived,
          previousArchived.filter((q) => q.id !== id)
        );
      }

      return { previousArchived };
    },

    // Rollback on error
    onError: (error, _id, context) => {
      if (context?.previousArchived) {
        queryClient.setQueryData(
          queryKeys.questions.archived,
          context.previousArchived
        );
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to restore question', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success feedback
    onSuccess: () => {
      toast.success('Question restored');
    },

    // Always invalidate to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.archived,
      });
    },
  });
}
