/**
 * useSubmitDecision Hook
 *
 * TanStack Query mutation hook for submitting any type of decision.
 * Handles approved, approved_with_constraint, and explore_alternatives.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Decision, SubmitDecisionInput, DecisionType } from '@/types/decision';

interface UseSubmitDecisionOptions {
  /**
   * Called after successful submission with the new decision.
   * Use this to handle undo window, card animations, etc.
   */
  onSuccess?: (decision: Decision) => void;
}

/**
 * Get question status based on decision type.
 */
function getQuestionStatusForDecision(
  decisionType: DecisionType
): 'approved' | 'exploring_alternatives' {
  switch (decisionType) {
    case 'approved':
    case 'approved_with_constraint':
      return 'approved';
    case 'explore_alternatives':
      return 'exploring_alternatives';
    default:
      return 'approved';
  }
}

/**
 * Hook for submitting a decision on a question.
 *
 * Features:
 * - Unified API for all decision types
 * - Updates question status automatically
 * - Cache invalidation for both decisions and questions
 * - Error handling with toast
 *
 * @param userId - Current user's ID (for created_by)
 * @param options - Optional callbacks
 *
 * @example
 * const { mutate: submitDecision, isPending } = useSubmitDecision(userId);
 *
 * // Approve
 * submitDecision({ question_id: 'q1', decision_type: 'approved' });
 *
 * // Approve with constraints
 * submitDecision({
 *   question_id: 'q1',
 *   decision_type: 'approved_with_constraint',
 *   constraints: [{ type: 'budget', context: 'Under $50k' }]
 * });
 *
 * // Explore alternatives
 * submitDecision({
 *   question_id: 'q1',
 *   decision_type: 'explore_alternatives',
 *   reasoning: 'Need more market data before deciding'
 * });
 */
export function useSubmitDecision(
  userId: string,
  options?: UseSubmitDecisionOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitDecisionInput) => {
      // Create the decision
      const decision = await decisionsRepo.create({
        question_id: input.question_id,
        decision_type: input.decision_type,
        constraints: input.constraints ?? null,
        reasoning: input.reasoning ?? null,
        created_by: userId,
      });

      // Update question status
      const newStatus = getQuestionStatusForDecision(input.decision_type);
      await questionsRepo.update(input.question_id, { status: newStatus });

      return decision;
    },

    onSuccess: (decision) => {
      // Show success toast based on decision type
      const messages: Record<DecisionType, string> = {
        approved: 'Approved!',
        approved_with_constraint: 'Approved with constraints',
        explore_alternatives: 'Exploring alternatives',
      };
      toast.success(messages[decision.decision_type] ?? 'Decision saved');

      // Call optional success callback
      options?.onSuccess?.(decision);
    },

    onError: (error) => {
      toast.error('Failed to submit decision', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate both decisions and questions caches
      queryClient.invalidateQueries({
        queryKey: queryKeys.decisions.byQuestion(variables.question_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(variables.question_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all,
      });
    },
  });
}
