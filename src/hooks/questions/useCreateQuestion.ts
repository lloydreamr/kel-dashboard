import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useOfflineGuard, isOfflineError } from '@/hooks/offline';
import { useMountedRef } from '@/hooks/utils/useMountedRef';
import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { CreateQuestionInput, Question } from '@/types/question';

/**
 * Hook for creating a new question with optimistic updates.
 *
 * Features:
 * - Optimistic UI: Shows pending question immediately
 * - Auto-rollback on error
 * - Success toast and navigation
 * - Cache invalidation on settle
 * - Offline guard: Blocks operation when offline (Story 10.3)
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { guardOffline } = useOfflineGuard();
  const { isMounted } = useMountedRef();

  return useMutation({
    mutationFn: (input: CreateQuestionInput) => {
      return questionsRepo.create(input);
    },

    // Optimistic update: Add pending question to list
    onMutate: async (newQuestion) => {
      // Check offline status FIRST before any async operations
      // This prevents mutation from getting stuck on cancelQueries when offline
      guardOffline(); // Throws OfflineError if offline

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.questions.all });

      // Snapshot previous value
      const previousQuestions = queryClient.getQueryData<Question[]>(
        queryKeys.questions.all
      );

      // Optimistically add the new question
      if (previousQuestions) {
        const optimisticQuestion: Question = {
          id: `temp-${Date.now()}`,
          title: newQuestion.title,
          description: newQuestion.description ?? null,
          category: newQuestion.category,
          recommendation: newQuestion.recommendation ?? null,
          recommendation_rationale: newQuestion.recommendation_rationale ?? null,
          status: newQuestion.status ?? 'draft',
          created_by: newQuestion.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          viewed_by_kel_at: null,
        };
        queryClient.setQueryData(queryKeys.questions.all, [
          optimisticQuestion,
          ...previousQuestions,
        ]);
      }

      return { previousQuestions };
    },

    // Rollback on error
    onError: (error, _newQuestion, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          queryKeys.questions.all,
          context.previousQuestions
        );
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to create question', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success: toast and navigate to detail page
    // BUG-009 Fix: Only navigate if component is still mounted (prevents race condition)
    onSuccess: (data) => {
      toast.success('Question created'); // Always show toast
      if (isMounted()) {
        router.push(`/questions/${data.id}`);
      }
    },

    // Always invalidate to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
    },
  });
}
