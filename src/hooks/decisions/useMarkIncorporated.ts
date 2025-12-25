/**
 * useMarkIncorporated Hook
 *
 * TanStack Query mutation for marking a decision's constraints as incorporated.
 * Used when Maho has addressed Kel's constraint feedback.
 *
 * Flow:
 * 1. Optimistic update: Set incorporated_at in cache
 * 2. Call decisionsRepo.markIncorporated(decisionId)
 * 3. Show success toast on completion
 * 4. Invalidate queries on success
 * 5. Rollback on error with error toast + retry
 *
 * Story 4-9: Mark Constraint as Incorporated
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';

import type { Decision } from '@/types/decision';

export interface MarkIncorporatedInput {
  decisionId: string;
  questionId: string;
}

export interface UseMarkIncorporatedResult {
  /**
   * Execute the mark incorporated mutation
   */
  markIncorporated: (input: MarkIncorporatedInput) => void;

  /**
   * Execute mutation and return a promise
   */
  markIncorporatedAsync: (input: MarkIncorporatedInput) => Promise<Decision>;

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
 * Hook for marking a decision's constraints as incorporated with optimistic UI updates.
 *
 * @example
 * ```tsx
 * const { markIncorporated, isPending } = useMarkIncorporated();
 *
 * const handleMarkIncorporated = () => {
 *   markIncorporated({
 *     decisionId: decision.id,
 *     questionId: question.id,
 *   });
 * };
 * ```
 */
export function useMarkIncorporated(): UseMarkIncorporatedResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      decisionId,
    }: MarkIncorporatedInput): Promise<Decision> => {
      return await decisionsRepo.markIncorporated(decisionId);
    },

    onMutate: async ({ questionId }: MarkIncorporatedInput) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: queryKeys.decisions.byQuestion(questionId),
      });

      // Snapshot previous decision for rollback
      const previousDecision = queryClient.getQueryData<Decision>(
        queryKeys.decisions.byQuestion(questionId)
      );

      // Optimistically update - set incorporated_at to now
      if (previousDecision) {
        queryClient.setQueryData<Decision>(
          queryKeys.decisions.byQuestion(questionId),
          {
            ...previousDecision,
            incorporated_at: new Date().toISOString(),
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
      toast.error("Couldn't mark as incorporated. Try again?", {
        id: `mark-incorporated-error-${variables.decisionId}`,
        action: {
          label: 'Retry',
          onClick: () => mutation.mutate(variables),
        },
      });
    },

    onSuccess: (_data, { questionId, decisionId }) => {
      // Invalidate to ensure fresh data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.decisions.byQuestion(questionId),
      });

      // Show success toast
      toast.success('Marked as incorporated', {
        id: `mark-incorporated-${decisionId}`,
        duration: 3000,
      });
    },
  });

  return {
    markIncorporated: mutation.mutate,
    markIncorporatedAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
