/**
 * useFilteredCompanies Hook
 *
 * Hook for filtering companies by category and search query.
 * Performs client-side filtering on the full companies list.
 */

import { useMemo } from 'react';

import { useCompanies } from './useCompanies';

import type { Company, CategoryFilterKey } from '@/types';

interface FilteredCompaniesResult {
  companies: Company[];
  counts: Record<CategoryFilterKey, number>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for filtering companies by category and search query.
 * Returns filtered list and counts for each category.
 *
 * @param category - Category filter key ('all' shows everything)
 * @param searchQuery - Search string to filter by name (case-insensitive)
 * @returns Filtered companies, category counts, loading state, and error
 *
 * @example
 * const { companies, counts, isLoading } = useFilteredCompanies('local_major', 'URC');
 */
export function useFilteredCompanies(
  category: CategoryFilterKey = 'all',
  searchQuery: string = ''
): FilteredCompaniesResult {
  const { data: allCompanies, isLoading, error, refetch } = useCompanies();

  const { companies, counts } = useMemo(() => {
    if (!allCompanies) {
      return {
        companies: [],
        counts: { all: 0, local_major: 0, multinational: 0, importer: 0, niche: 0 },
      };
    }

    // Apply search filter first (search applies across all categories)
    let searchFiltered = allCompanies;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchFiltered = allCompanies.filter((c) => c.name.toLowerCase().includes(query));
    }

    // Build counts from search-filtered results (so counts reflect search matches per category)
    const counts: Record<CategoryFilterKey, number> = {
      all: searchFiltered.length,
      local_major: searchFiltered.filter((c) => c.category === 'local_major').length,
      multinational: searchFiltered.filter((c) => c.category === 'multinational').length,
      importer: searchFiltered.filter((c) => c.category === 'importer').length,
      niche: searchFiltered.filter((c) => c.category === 'niche').length,
    };

    // Then apply category filter
    const filtered =
      category === 'all'
        ? searchFiltered
        : searchFiltered.filter((c) => c.category === category);

    return { companies: filtered, counts };
  }, [allCompanies, category, searchQuery]);

  return { companies, counts, isLoading, error: error ?? null, refetch };
}
