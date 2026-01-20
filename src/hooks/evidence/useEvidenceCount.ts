/**
 * useEvidenceCount Hook
 *
 * TanStack Query hook for fetching evidence count for a question.
 * Used in QueueCard expanded state.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

interface UseEvidenceCountResult {
  count: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching evidence count for a specific question.
 *
 * @param questionId - The question ID to count evidence for
 * @returns Query result with evidence count
 *
 * @example
 * const { count, isLoading } = useEvidenceCount('question-123');
 */
export function useEvidenceCount(questionId: string): UseEvidenceCountResult {
  const query = useQuery({
    queryKey: queryKeys.evidence.count(questionId),
    queryFn: () => evidenceRepo.countByQuestionId(questionId),
    // Only fetch when card is expanded (enabled by consumer)
    staleTime: 30 * 1000, // 30s - evidence doesn't change often
  });

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
