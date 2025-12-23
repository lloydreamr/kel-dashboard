/**
 * useArchiveQuestion Hook
 *
 * TanStack Query mutation for archiving questions with optimistic UI.
 * Moves a question to archived status (soft delete).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Question } from '@/types/question';

/**
 * Hook for archiving a question with optimistic updates.
 *
 * Features:
 * - Optimistic UI: Removes from list immediately
 * - Auto-rollback on error
 * - Success toast with archive confirmation
 * - Invalidates both questions list and archived list
 *
 * @example
 * const { mutate: archiveQuestion, isPending } = useArchiveQuestion();
 * archiveQuestion('question-123');
 */
export function useArchiveQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionsRepo.archive(id),

    // Optimistic update: Remove from questions list immediately
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.questions.all,
      });

      // Snapshot previous list
      const previousQuestions = queryClient.getQueryData<Question[]>(
        queryKeys.questions.all
      );

      // Optimistically remove from list
      if (previousQuestions) {
        queryClient.setQueryData(
          queryKeys.questions.all,
          previousQuestions.filter((q) => q.id !== id)
        );
      }

      return { previousQuestions };
    },

    // Rollback on error
    onError: (error, _id, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          queryKeys.questions.all,
          context.previousQuestions
        );
      }
      toast.error('Failed to archive question', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success feedback
    onSuccess: () => {
      toast.success('Question archived');
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
