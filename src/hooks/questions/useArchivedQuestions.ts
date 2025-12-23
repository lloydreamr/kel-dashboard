/**
 * useArchivedQuestions Hook
 *
 * TanStack Query hook for fetching archived questions.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

/**
 * Hook for fetching all archived questions.
 *
 * Returns questions ordered by updated_at (most recently archived first).
 *
 * @returns Query result with archived questions array
 *
 * @example
 * const { data: archivedQuestions, isLoading, error } = useArchivedQuestions();
 */
export function useArchivedQuestions() {
  return useQuery({
    queryKey: queryKeys.questions.archived,
    queryFn: () => questionsRepo.getArchived(),
  });
}
