/**
 * useEvidence Hook
 *
 * TanStack Query hook for fetching evidence for a specific question.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import type { Evidence } from '@/types/evidence';

interface UseEvidenceResult {
  data: Evidence[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching evidence attached to a question.
 *
 * @param questionId - Question ID to fetch evidence for
 * @returns Query result with evidence array
 *
 * @example
 * const { data: evidence, isLoading, error } = useEvidence(questionId);
 */
export function useEvidence(questionId: string): UseEvidenceResult {
  const query = useQuery({
    queryKey: queryKeys.evidence.byQuestion(questionId),
    queryFn: () => evidenceRepo.getByQuestionId(questionId),
    enabled: !!questionId,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
