/**
 * useQuestion Hook
 *
 * TanStack Query hook for fetching a single question by ID.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

/**
 * Hook for fetching a single question by ID.
 *
 * @param id - Question ID to fetch
 * @returns Query result with question data
 *
 * @example
 * const { data: question, isLoading, error } = useQuestion('q-123');
 */
export function useQuestion(id: string) {
  return useQuery({
    queryKey: queryKeys.questions.detail(id),
    queryFn: () => questionsRepo.getById(id),
    enabled: !!id,
  });
}
