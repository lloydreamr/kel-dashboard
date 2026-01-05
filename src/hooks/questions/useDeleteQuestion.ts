/**
 * useDeleteQuestion Hook
 *
 * TanStack Query mutation for permanently deleting questions with optimistic UI.
 * WARNING: This is a hard delete - use useArchiveQuestion for soft delete.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Question } from '@/types/question';

/**
 * Hook for permanently deleting a question with optimistic updates.
 *
 * Features:
 * - Optimistic UI: Removes from list immediately
 * - Auto-rollback on error
 * - Success toast with deletion confirmation
 * - Invalidates questions list
 *
 * WARNING: This permanently deletes the question. For soft delete, use useArchiveQuestion.
 *
 * @example
 * const { mutate: deleteQuestion, isPending } = useDeleteQuestion();
 * deleteQuestion('question-123');
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionsRepo.delete(id),

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
      toast.error('Failed to delete question', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success feedback
    onSuccess: () => {
      toast.success('Question deleted');
    },

    // Always invalidate to ensure consistency
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all,
      });
      // Also invalidate detail query to prevent stale cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(id),
      });
    },
  });
}
