/**
 * useApproveDecision Hook
 *
 * TanStack Query mutation for approving a question.
 * Implements optimistic UI updates for instant feedback.
 *
 * Flow:
 * 1. Optimistic update: Mark question as approved in cache
 * 2. Create decision record with type 'approved'
 * 3. Update question status to 'approved'
 * 4. Invalidate queries on success
 * 5. Rollback on error
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useProfile } from '@/hooks/auth';
import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';
import { DECISION_TYPES } from '@/types/decision';

import type { Decision } from '@/types/decision';
import type { Question } from '@/types/question';

export interface ApproveDecisionInput {
  questionId: string;
}

export interface ApproveDecisionResult {
  decision: Decision;
  question: Question;
}

export interface UseApproveDecisionResult {
  /**
   * Execute the approve mutation
   */
  approve: (input: ApproveDecisionInput) => void;

  /**
   * Execute approve and return a promise
   */
  approveAsync: (input: ApproveDecisionInput) => Promise<ApproveDecisionResult>;

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
 * Hook for approving a question with optimistic UI updates.
 *
 * @example
 * ```tsx
 * const { approve, isPending } = useApproveDecision();
 *
 * const handleApprove = () => {
 *   approve({ questionId: question.id });
 * };
 * ```
 */
export function useApproveDecision(): UseApproveDecisionResult {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const mutation = useMutation({
    mutationFn: async ({
      questionId,
    }: ApproveDecisionInput): Promise<ApproveDecisionResult> => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      // Create decision record
      const decision = await decisionsRepo.create({
        question_id: questionId,
        decision_type: DECISION_TYPES.APPROVED,
        created_by: profile.id,
      });

      // Update question status
      const question = await questionsRepo.updateStatus(questionId, 'approved');

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
            q.id === questionId ? { ...q, status: 'approved' as const } : q
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
    approve: mutation.mutate,
    approveAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    decisionId: mutation.data?.decision.id ?? null,
    reset: mutation.reset,
  };
}
