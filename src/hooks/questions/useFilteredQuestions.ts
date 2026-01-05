/**
 * useFilteredQuestions Hook
 *
 * Filters questions by status and calculates counts for each filter option.
 * Uses useQuestions internally and performs client-side filtering.
 */

import { useMemo } from 'react';

import {
  StatusFilterKey,
  STATUS_FILTER_CONFIG,
  STATUS_FILTER_KEYS,
} from '@/types/question';

import { useQuestions } from './useQuestions';

import type { Question } from '@/types/database';

interface FilteredQuestionsResult {
  /** Filtered questions based on current filter */
  questions: Question[];
  /** Count of questions for each filter option */
  counts: Record<StatusFilterKey, number>;
  /** Loading state from useQuestions */
  isLoading: boolean;
  /** Error from useQuestions */
  error: Error | null;
}

/**
 * Hook for filtering questions by status with memoized results.
 *
 * @param filter - The status filter key to apply
 * @returns Filtered questions and counts for all filter options
 *
 * @example
 * const { questions, counts, isLoading } = useFilteredQuestions('draft');
 * // questions = only draft questions
 * // counts = { all: 10, draft: 3, sent: 4, decided: 3 }
 */
export function useFilteredQuestions(filter: StatusFilterKey): FilteredQuestionsResult {
  const { data: allQuestions, isLoading, error } = useQuestions();

  const { questions, counts } = useMemo(() => {
    if (!allQuestions) {
      const emptyCounts = STATUS_FILTER_KEYS.reduce(
        (acc, key) => ({ ...acc, [key]: 0 }),
        {} as Record<StatusFilterKey, number>
      );
      return { questions: [], counts: emptyCounts };
    }

    // Calculate counts for all filters
    const counts = STATUS_FILTER_KEYS.reduce((acc, key) => {
      const config = STATUS_FILTER_CONFIG[key];
      acc[key] =
        config.statuses === null
          ? allQuestions.length
          : allQuestions.filter((q) => config.statuses!.includes(q.status)).length;
      return acc;
    }, {} as Record<StatusFilterKey, number>);

    // Filter questions based on current filter
    const config = STATUS_FILTER_CONFIG[filter];
    const questions =
      config.statuses === null
        ? allQuestions
        : allQuestions.filter((q) => config.statuses!.includes(q.status));

    return { questions, counts };
  }, [allQuestions, filter]);

  return { questions, counts, isLoading, error: error as Error | null };
}
