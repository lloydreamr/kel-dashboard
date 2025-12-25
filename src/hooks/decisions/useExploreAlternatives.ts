/**
 * useExploreAlternatives Hook
 *
 * TanStack Query mutation for requesting alternatives to a question's recommendation.
 * Creates a decision with reasoning explaining Kel's concerns.
 *
 * Flow:
 * 1. Optimistic update: Mark question as exploring_alternatives in cache
 * 2. Create decision record with type 'explore_alternatives'
 * 3. Save reasoning to the reasoning column
 * 4. Update question status to 'exploring_alternatives'
 * 5. Invalidate queries on success
 * 6. Rollback on error
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useProfile } from '@/hooks/auth';
import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';
import { DECISION_TYPES } from '@/types/decision';

import type { Decision } from '@/types/decision';
import type { Question } from '@/types/question';

export interface ExploreAlternativesInput {
  questionId: string;
  reasoning: string;
}

export interface ExploreAlternativesResult {
  decision: Decision;
  question: Question;
}

export interface UseExploreAlternativesResult {
  /**
   * Execute the explore alternatives mutation
   */
  exploreAlternatives: (input: ExploreAlternativesInput) => void;

  /**
   * Execute mutation and return a promise
   */
  exploreAlternativesAsync: (
    input: ExploreAlternativesInput
  ) => Promise<ExploreAlternativesResult>;

  /**
   * Whether the mutation is in progress
   */
  isPending: boolean;

  /**
   * Error from the last mutation attempt
   */
  error: Error | null;

  /**
   * Whether the last mutation was successful
   */
  isSuccess: boolean;

  /**
   * Whether the last mutation resulted in an error
   */
  isError: boolean;

  /**
   * The created decision ID (available after success)
   */
  decisionId: string | null;

  /**
   * Reset the mutation state
   */
  reset: () => void;
}

/**
 * Hook for requesting alternatives with reasoning and optimistic UI updates.
 *
 * @example
 * ```tsx
 * const { exploreAlternatives, isPending } = useExploreAlternatives();
 *
 * const handleSubmit = (reasoning: string) => {
 *   exploreAlternatives({
 *     questionId: question.id,
 *     reasoning,
 *   });
 * };
 * ```
 */
export function useExploreAlternatives(): UseExploreAlternativesResult {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const mutation = useMutation({
    mutationFn: async ({
      questionId,
      reasoning,
    }: ExploreAlternativesInput): Promise<ExploreAlternativesResult> => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      // Create decision record with reasoning
      const decision = await decisionsRepo.create({
        question_id: questionId,
        decision_type: DECISION_TYPES.EXPLORE_ALTERNATIVES,
        reasoning: reasoning,
        created_by: profile.id,
      });

      // Update question status
      const question = await questionsRepo.updateStatus(
        questionId,
        'exploring_alternatives'
      );

      return { decision, question };
    },

    onMutate: async ({ questionId }) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.questions.all });

      // Snapshot previous questions for rollback
      const previousQuestions = queryClient.getQueryData<Question[]>(
        queryKeys.questions.all
      );

      // Optimistically update the question status
      queryClient.setQueryData<Question[]>(
        queryKeys.questions.all,
        (old) =>
          old?.map((q) =>
            q.id === questionId
              ? { ...q, status: 'exploring_alternatives' as const }
              : q
          ) ?? []
      );

      // Return context for rollback
      return { previousQuestions };
    },

    onError: (_error, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          queryKeys.questions.all,
          context.previousQuestions
        );
      }
    },

    onSuccess: (_data, { questionId }) => {
      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.decisions.byQuestion(questionId),
      });
    },
  });

  return {
    exploreAlternatives: mutation.mutate,
    exploreAlternativesAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    decisionId: mutation.data?.decision.id ?? null,
    reset: mutation.reset,
  };
}
