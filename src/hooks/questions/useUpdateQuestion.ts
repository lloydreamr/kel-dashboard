/**
 * useUpdateQuestion Hook
 *
 * TanStack Query mutation for updating questions with optimistic UI.
 * Used for adding/editing recommendations and other question updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Question, UpdateQuestionInput } from '@/types/question';

interface UpdateQuestionVariables {
  id: string;
  updates: UpdateQuestionInput;
}

/**
 * Hook for updating a question with optimistic updates.
 *
 * Features:
 * - Optimistic UI: Updates cache immediately
 * - Auto-rollback on error
 * - Context-aware success toast (recommendation vs general update)
 * - Cache invalidation on settle
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateQuestionVariables) =>
      questionsRepo.update(id, updates),

    // Optimistic update: Update cache immediately
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches for this question
      await queryClient.cancelQueries({
        queryKey: queryKeys.questions.detail(id),
      });

      // Snapshot previous value
      const previousQuestion = queryClient.getQueryData<Question>(
        queryKeys.questions.detail(id)
      );

      // Optimistically update to new value
      if (previousQuestion) {
        queryClient.setQueryData(queryKeys.questions.detail(id), {
          ...previousQuestion,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousQuestion };
    },

    // Rollback on error
    onError: (error, { id }, context) => {
      if (context?.previousQuestion) {
        queryClient.setQueryData(
          queryKeys.questions.detail(id),
          context.previousQuestion
        );
      }
      toast.error('Failed to update question', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success toast (message varies based on what was updated)
    onSuccess: (_data, { updates }) => {
      if (updates.recommendation !== undefined) {
        toast.success('Recommendation added');
      } else if (updates.category !== undefined) {
        toast.success(`Category updated to ${updates.category}`);
      } else {
        toast.success('Question updated');
      }
    },

    // Always invalidate to ensure consistency
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all,
      });
    },
  });
}
