/**
 * useStaleQuestionsByCategory Hook
 *
 * Fetches questions for a given category and filters for stale ones.
 * Uses the byCategory query key for cache coherence - when questions
 * are updated (e.g., via useMarkQuestionCurrent), this query auto-invalidates.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { questionsRepo } from '@/lib/repositories/questions';
import { isStale } from '@/lib/utils/staleness';

import type { QuestionCategory, QuestionWithEvidenceCount } from '@/types/question';

interface StaleQuestionsResult {
  staleCount: number;
  staleQuestions: QuestionWithEvidenceCount[];
}

/**
 * Hook for fetching stale questions by category.
 * Uses byCategory query key to ensure cache coherence with question updates.
 * Filters questions in-memory using the isStale utility.
 *
 * @param category - The question category to filter by
 * @returns Query result with stale count and questions (with evidence counts)
 */
export function useStaleQuestionsByCategory(category: QuestionCategory) {
  return useQuery({
    // Use byCategory key for cache coherence - when questions update,
    // this query auto-invalidates (no separate stale key needed)
    queryKey: queryKeys.questions.byCategory(category),
    queryFn: async (): Promise<StaleQuestionsResult> => {
      const questions = await questionsRepo.getByCategoryWithEvidenceCount(category);
      const staleQuestions = questions.filter((q) => isStale(q.updated_at));

      return {
        staleCount: staleQuestions.length,
        staleQuestions,
      };
    },
  });
}
