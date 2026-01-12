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

    // Build counts first (always from full dataset, before filtering)
    const counts: Record<CategoryFilterKey, number> = {
      all: allCompanies.length,
      local_major: allCompanies.filter((c) => c.category === 'local_major').length,
      multinational: allCompanies.filter((c) => c.category === 'multinational').length,
      importer: allCompanies.filter((c) => c.category === 'importer').length,
      niche: allCompanies.filter((c) => c.category === 'niche').length,
    };

    // Filter by category
    let filtered =
      category === 'all'
        ? allCompanies
        : allCompanies.filter((c) => c.category === category);

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(query));
    }

    return { companies: filtered, counts };
  }, [allCompanies, category, searchQuery]);

  return { companies, counts, isLoading, error: error ?? null, refetch };
}
