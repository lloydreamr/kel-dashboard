/**
 * useFilteredQuestions Hook
 *
 * Filters questions by status, category, and search query.
 * Calculates counts for each filter option.
 * Uses useQuestions internally and performs client-side filtering.
 *
 * Story 13.3: Added category filtering support
 * UX Audit: Added search query filtering
 */

import { useMemo } from 'react';

import {
  CategoryCounts,
  CategoryFilterKey,
  CATEGORY_FILTER_KEYS,
  StatusFilterKey,
  STATUS_FILTER_CONFIG,
  STATUS_FILTER_KEYS,
} from '@/types/question';

import { useQuestions } from './useQuestions';

import type { QuestionWithEvidenceCount } from '@/types/question';

interface FilteredQuestionsResult {
  /** Filtered questions based on current status and category filters */
  questions: QuestionWithEvidenceCount[];
  /** Count of questions for each status filter option */
  counts: Record<StatusFilterKey, number>;
  /** Count of questions for each category (independent of status filter) */
  categoryCounts: CategoryCounts;
  /** Loading state from useQuestions */
  isLoading: boolean;
  /** Error from useQuestions */
  error: Error | null;
}

/**
 * Check if a question matches a search query.
 * Searches in title and description (case-insensitive).
 */
function matchesSearchQuery(
  question: QuestionWithEvidenceCount,
  query: string
): boolean {
  if (!query.trim()) return true;

  const searchLower = query.toLowerCase().trim();
  const titleMatch = question.title.toLowerCase().includes(searchLower);
  const descriptionMatch = question.description
    ?.toLowerCase()
    .includes(searchLower);

  return titleMatch || !!descriptionMatch;
}

/**
 * Hook for filtering questions by status, category, and search query with memoized results.
 *
 * @param filter - The status filter key to apply
 * @param category - Optional category filter key (defaults to 'all')
 * @param searchQuery - Optional search query to filter by title/description
 * @returns Filtered questions and counts for all filter options
 *
 * @example
 * const { questions, counts, categoryCounts, isLoading } = useFilteredQuestions('draft', 'market', 'price');
 * // questions = only draft questions in market category matching 'price'
 * // counts = { all: 10, draft: 3, sent: 4, decided: 3 } (status counts, pre-search)
 * // categoryCounts = { all: 10, market: 4, product: 3, distribution: 3 } (category counts, pre-search)
 */
export function useFilteredQuestions(
  filter: StatusFilterKey,
  category: CategoryFilterKey = 'all',
  searchQuery: string = ''
): FilteredQuestionsResult {
  const { data: allQuestions, isLoading, error } = useQuestions();

  const { questions, counts, categoryCounts } = useMemo(() => {
    if (!allQuestions) {
      const emptyStatusCounts = STATUS_FILTER_KEYS.reduce(
        (acc, key) => ({ ...acc, [key]: 0 }),
        {} as Record<StatusFilterKey, number>
      );
      const emptyCategoryCounts = CATEGORY_FILTER_KEYS.reduce(
        (acc, key) => ({ ...acc, [key]: 0 }),
        {} as CategoryCounts
      );
      return { questions: [], counts: emptyStatusCounts, categoryCounts: emptyCategoryCounts };
    }

    // Calculate status counts (for StatusFilter)
    const counts = STATUS_FILTER_KEYS.reduce((acc, key) => {
      const config = STATUS_FILTER_CONFIG[key];
      acc[key] =
        config.statuses === null
          ? allQuestions.length
          : allQuestions.filter((q) => config.statuses!.includes(q.status)).length;
      return acc;
    }, {} as Record<StatusFilterKey, number>);

    // Calculate category counts (independent of status filter - for CategoryTabs)
    const categoryCounts = CATEGORY_FILTER_KEYS.reduce((acc, key) => {
      if (key === 'all') {
        acc[key] = allQuestions.length;
      } else {
        acc[key] = allQuestions.filter((q) => q.category === key).length;
      }
      return acc;
    }, {} as CategoryCounts);

    // Filter questions based on status filter
    const statusConfig = STATUS_FILTER_CONFIG[filter];
    let filteredQuestions =
      statusConfig.statuses === null
        ? allQuestions
        : allQuestions.filter((q) => statusConfig.statuses!.includes(q.status));

    // Also filter by category if not 'all'
    if (category !== 'all') {
      filteredQuestions = filteredQuestions.filter((q) => q.category === category);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filteredQuestions = filteredQuestions.filter((q) =>
        matchesSearchQuery(q, searchQuery)
      );
    }

    return { questions: filteredQuestions, counts, categoryCounts };
  }, [allQuestions, filter, category, searchQuery]);

  return { questions, counts, categoryCounts, isLoading, error: error as Error | null };
}
