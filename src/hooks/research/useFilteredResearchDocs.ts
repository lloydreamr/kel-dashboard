/**
 * useFilteredResearchDocs Hook
 *
 * Hook for filtering research documents by category and search query.
 * Performs client-side filtering on the full research docs list.
 */

import { useMemo } from 'react';

import { useResearchDocs } from './useResearchDocs';

import type { ResearchDoc, ResearchCategoryFilterKey } from '@/types';

interface FilteredResearchDocsResult {
  docs: ResearchDoc[];
  categoryCounts: Record<ResearchCategoryFilterKey, number>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Known category values (excluding 'general' which is a catch-all) */
const KNOWN_CATEGORIES = ['consumers', 'trends', 'distribution', 'regulatory'];

/**
 * Hook for filtering research documents by category and search query.
 * Returns filtered list and counts for each category.
 *
 * @param category - Category filter key ('all' shows everything, 'general' shows null/unknown)
 * @param searchQuery - Search string to filter by title (case-insensitive)
 * @returns Filtered docs, category counts, loading state, and error
 *
 * @example
 * const { docs, categoryCounts, isLoading } = useFilteredResearchDocs('consumers', 'millennials');
 */
export function useFilteredResearchDocs(
  category: ResearchCategoryFilterKey = 'all',
  searchQuery: string = ''
): FilteredResearchDocsResult {
  const { data: allDocs, isLoading, error, refetch } = useResearchDocs();

  const { docs, categoryCounts } = useMemo(() => {
    if (!allDocs) {
      return {
        docs: [],
        categoryCounts: {
          all: 0,
          consumers: 0,
          trends: 0,
          distribution: 0,
          regulatory: 0,
          general: 0,
        },
      };
    }

    // Build category counts (always from full dataset, before filtering)
    const categoryCounts: Record<ResearchCategoryFilterKey, number> = {
      all: allDocs.length,
      consumers: allDocs.filter((d) => d.category === 'consumers').length,
      trends: allDocs.filter((d) => d.category === 'trends').length,
      distribution: allDocs.filter((d) => d.category === 'distribution').length,
      regulatory: allDocs.filter((d) => d.category === 'regulatory').length,
      general: allDocs.filter(
        (d) => !KNOWN_CATEGORIES.includes(d.category ?? '')
      ).length,
    };

    // Filter by category
    let filtered =
      category === 'all'
        ? allDocs
        : category === 'general'
          ? allDocs.filter((d) => !KNOWN_CATEGORIES.includes(d.category ?? ''))
          : allDocs.filter((d) => d.category === category);

    // Filter by search query (case-insensitive on title AND summary per AC#3)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          (d.summary?.toLowerCase().includes(query) ?? false)
      );
    }

    return { docs: filtered, categoryCounts };
  }, [allDocs, category, searchQuery]);

  return { docs, categoryCounts, isLoading, error: error ?? null, refetch };
}
