/**
 * useQuestions Hook
 *
 * TanStack Query hook for fetching all non-archived questions with evidence counts.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

/**
 * Hook for fetching all non-archived questions with evidence counts.
 *
 * @returns Query result with questions array including evidence_count
 *
 * @example
 * const { data: questions, isLoading, error } = useQuestions();
 */
export function useQuestions() {
  return useQuery({
    queryKey: queryKeys.questions.all,
    queryFn: () => questionsRepo.getAllWithEvidenceCount(),
  });
}
