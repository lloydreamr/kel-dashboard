/**
 * useDecision Hook
 *
 * TanStack Query hook for fetching a decision for a specific question.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';

import type { Decision } from '@/types/decision';

interface UseDecisionResult {
  data: Decision | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching the decision for a question.
 *
 * @param questionId - Question ID to fetch decision for
 * @returns Query result with decision (or null if none exists)
 *
 * @example
 * const { data: decision, isLoading } = useDecision(questionId);
 */
export function useDecision(questionId: string): UseDecisionResult {
  const query = useQuery({
    queryKey: queryKeys.decisions.byQuestion(questionId),
    queryFn: () => decisionsRepo.getByQuestionId(questionId),
    enabled: !!questionId,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
