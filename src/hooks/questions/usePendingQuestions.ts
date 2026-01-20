/**
 * usePendingQuestions Hook
 *
 * TanStack Query hook for fetching questions ready for Kel's review.
 * Returns questions with status 'ready_for_kel' ordered by created_at.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

import type { Question } from '@/types/question';

interface UsePendingQuestionsResult {
  data: Question[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching pending questions for Kel's decision queue.
 *
 * @returns Query result with pending questions array (oldest first)
 *
 * @example
 * const { data: pendingQuestions, isLoading } = usePendingQuestions();
 */
export function usePendingQuestions(): UsePendingQuestionsResult {
  const query = useQuery({
    queryKey: queryKeys.questions.byStatus('ready_for_kel'),
    queryFn: async () => {
      const questions = await questionsRepo.getByStatus('ready_for_kel');
      // Sort by created_at ascending (oldest first for FIFO)
      return questions.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
