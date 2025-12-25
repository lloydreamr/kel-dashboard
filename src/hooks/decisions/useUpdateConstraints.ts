/**
 * useUpdateConstraints Hook
 *
 * TanStack Query mutation for updating constraints on an existing decision.
 * Used when Kel wants to edit their previously submitted constraints.
 *
 * Flow:
 * 1. Optimistic update: Update constraints in decision cache
 * 2. Call decisionsRepo.update() with new constraints
 * 3. Show success toast on completion
 * 4. Invalidate queries on success
 * 5. Rollback on error with error toast + retry
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';

import type { Constraint, Decision } from '@/types/decision';

export interface UpdateConstraintsInput {
  decisionId: string;
  questionId: string;
  constraints: Constraint[];
  context?: string;
}

export interface UpdateConstraintsResult {
  decision: Decision;
}

export interface UseUpdateConstraintsResult {
  /**
   * Execute the update constraints mutation
   */
  updateConstraints: (input: UpdateConstraintsInput) => void;

  /**
   * Execute mutation and return a promise
   */
  updateConstraintsAsync: (
    input: UpdateConstraintsInput
  ) => Promise<UpdateConstraintsResult>;

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
   * Reset the mutation state
   */
  reset: () => void;
}

/**
 * Hook for updating constraints on an existing decision with optimistic UI updates.
 *
 * @example
 * ```tsx
 * const { updateConstraints, isPending } = useUpdateConstraints();
 *
 * const handleSave = () => {
 *   updateConstraints({
 *     decisionId: decision.id,
 *     questionId: question.id,
 *     constraints: [{ type: 'price' }, { type: 'timeline' }],
 *     context: 'Updated requirements',
 *   });
 * };
 * ```
 */
export function useUpdateConstraints(): UseUpdateConstraintsResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      decisionId,
      constraints,
      context,
    }: UpdateConstraintsInput): Promise<UpdateConstraintsResult> => {
      // Update decision with new constraints
      const decision = await decisionsRepo.update(decisionId, {
        constraints,
        constraint_context: context ?? null,
      });

      return { decision };
    },

    onMutate: async ({ questionId, constraints, context }) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: queryKeys.decisions.byQuestion(questionId),
      });

      // Snapshot previous decision for rollback
      const previousDecision = queryClient.getQueryData<Decision>(
        queryKeys.decisions.byQuestion(questionId)
      );

      // Optimistically update the decision in cache
      if (previousDecision) {
        queryClient.setQueryData<Decision>(
          queryKeys.decisions.byQuestion(questionId),
          {
            ...previousDecision,
            constraints: constraints as unknown as Decision['constraints'],
            constraint_context: context ?? null,
          }
        );
      }

      // Return context for rollback
      return { previousDecision, questionId };
    },

    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousDecision && context?.questionId) {
        queryClient.setQueryData(
          queryKeys.decisions.byQuestion(context.questionId),
          context.previousDecision
        );
      }

      // Show error toast with retry
      toast.error("Couldn't update. Try again?", {
        id: `update-constraints-error-${variables.decisionId}`,
        action: {
          label: 'Retry',
          onClick: () => mutation.mutate(variables),
        },
      });
    },

    onSuccess: (_data, { questionId, decisionId }) => {
      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.decisions.byQuestion(questionId),
      });

      // Show success toast
      toast.success('Constraints updated', {
        id: `update-constraints-${decisionId}`,
        duration: 3000,
      });
    },
  });

  return {
    updateConstraints: mutation.mutate,
    updateConstraintsAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
