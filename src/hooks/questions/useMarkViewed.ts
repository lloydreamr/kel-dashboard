/**
 * useMarkViewed Hook
 *
 * Mutation hook for recording when Kel views a question.
 * Only triggers once per session to avoid duplicate API calls.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';

/**
 * Hook for marking a question as viewed by Kel.
 * Uses a ref to ensure the mutation is only called once per session.
 *
 * @example
 * const { markViewed, hasMarked } = useMarkViewed();
 *
 * useEffect(() => {
 *   if (isKel && !hasMarked(questionId)) {
 *     markViewed(questionId);
 *   }
 * }, [isKel, questionId]);
 */
export function useMarkViewed() {
  const queryClient = useQueryClient();
  const markedRef = useRef<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: (questionId: string) => questionsRepo.markViewed(questionId),
    onSuccess: (updatedQuestion) => {
      // Update the cache with the new viewed_by_kel_at timestamp
      queryClient.setQueryData(
        queryKeys.questions.detail(updatedQuestion.id),
        updatedQuestion
      );
    },
  });

  const markViewed = (questionId: string) => {
    // Prevent duplicate calls for same question in same session
    if (markedRef.current.has(questionId)) {
      return;
    }
    markedRef.current.add(questionId);
    mutation.mutate(questionId);
  };

  const hasMarked = (questionId: string) => markedRef.current.has(questionId);

  return {
    markViewed,
    hasMarked,
    isPending: mutation.isPending,
  };
}
