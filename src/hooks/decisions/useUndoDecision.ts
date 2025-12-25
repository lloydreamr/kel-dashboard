/**
 * useUndoDecision Hook
 *
 * TanStack Query mutation hook for undoing a decision.
 * Used within the 5-second undo window (Story 4.13).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

/**
 * Hook for undoing a decision within the undo window.
 *
 * Deletes the decision and reverts the question status to 'ready_for_kel'.
 *
 * @example
 * const { mutate: undoDecision, isPending } = useUndoDecision();
 * undoDecision({ decisionId: 'd1', questionId: 'q1' });
 */
export function useUndoDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      decisionId,
      questionId,
    }: {
      decisionId: string;
      questionId: string;
    }) => {
      // Delete the decision
      await decisionsRepo.delete(decisionId);

      // Revert question status
      await questionsRepo.update(questionId, { status: 'ready_for_kel' });

      return { decisionId, questionId };
    },

    onSuccess: () => {
      toast.success('Decision undone');
    },

    onError: (error) => {
      toast.error('Failed to undo decision', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate caches
      queryClient.invalidateQueries({
        queryKey: queryKeys.decisions.byQuestion(variables.questionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(variables.questionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all,
      });
    },
  });
}
