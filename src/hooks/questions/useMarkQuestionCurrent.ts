/**
 * useMarkQuestionCurrent Hook
 *
 * TanStack Query mutation for marking a question as "current"
 * without changing its content. This clears stale data warnings
 * by refreshing the updated_at timestamp.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Question } from '@/types/question';

/**
 * Hook for marking a question as current (touch updated_at timestamp).
 *
 * Features:
 * - Optimistic UI: Updates cache immediately
 * - Auto-rollback on error
 * - Toast feedback on success/error
 * - Cache invalidation on settle
 */
export function useMarkQuestionCurrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionsRepo.touchUpdatedAt(id),

    // Optimistic update: Update cache immediately
    onMutate: async (id: string) => {
      // Cancel outgoing refetches for this question
      await queryClient.cancelQueries({
        queryKey: queryKeys.questions.detail(id),
      });

      // Snapshot previous value
      const previousQuestion = queryClient.getQueryData<Question>(
        queryKeys.questions.detail(id)
      );

      // Optimistically update to new timestamp
      if (previousQuestion) {
        queryClient.setQueryData(queryKeys.questions.detail(id), {
          ...previousQuestion,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousQuestion };
    },

    // Rollback on error
    onError: (error, id, context) => {
      if (context?.previousQuestion) {
        queryClient.setQueryData(
          queryKeys.questions.detail(id),
          context.previousQuestion
        );
      }
      toast.error('Failed to update timestamp', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success toast
    onSuccess: () => {
      toast.success('Data marked as current');
    },

    // Always invalidate to ensure consistency
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all,
      });
    },
  });
}
