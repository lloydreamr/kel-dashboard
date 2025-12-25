/**
 * useApproveWithConstraints Hook
 *
 * TanStack Query mutation for approving a question with constraints.
 * Extends the useApproveDecision pattern with constraint support.
 *
 * Flow:
 * 1. Optimistic update: Mark question as approved in cache
 * 2. Create decision record with type 'approved_with_constraint'
 * 3. Include constraints as JSONB array
 * 4. Update question status to 'approved'
 * 5. Invalidate queries on success
 * 6. Rollback on error
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useProfile } from '@/hooks/auth';
import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';
import { DECISION_TYPES } from '@/types/decision';

import type { Decision, Constraint } from '@/types/decision';
import type { Question } from '@/types/question';

export interface ApproveWithConstraintsInput {
  questionId: string;
  constraints: Constraint[];
  context?: string;
}

export interface ApproveWithConstraintsResult {
  decision: Decision;
  question: Question;
}

export interface UseApproveWithConstraintsResult {
  /**
   * Execute the approve with constraints mutation
   */
  approveWithConstraints: (input: ApproveWithConstraintsInput) => void;

  /**
   * Execute mutation and return a promise
   */
  approveWithConstraintsAsync: (
    input: ApproveWithConstraintsInput
  ) => Promise<ApproveWithConstraintsResult>;

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
 * Hook for approving a question with constraints and optimistic UI updates.
 *
 * @example
 * ```tsx
 * const { approveWithConstraints, isPending } = useApproveWithConstraints();
 *
 * const handleApprove = () => {
 *   approveWithConstraints({
 *     questionId: question.id,
 *     constraints: [{ type: 'price' }, { type: 'volume', context: 'Max 1000 units' }],
 *   });
 * };
 * ```
 */
export function useApproveWithConstraints(): UseApproveWithConstraintsResult {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const mutation = useMutation({
    mutationFn: async ({
      questionId,
      constraints,
      context,
    }: ApproveWithConstraintsInput): Promise<ApproveWithConstraintsResult> => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      // Create decision record with constraints
      const decision = await decisionsRepo.create({
        question_id: questionId,
        decision_type: DECISION_TYPES.APPROVED_WITH_CONSTRAINT,
        constraints: constraints,
        constraint_context: context ?? null,
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
    approveWithConstraints: mutation.mutate,
    approveWithConstraintsAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    decisionId: mutation.data?.decision.id ?? null,
    reset: mutation.reset,
  };
}
