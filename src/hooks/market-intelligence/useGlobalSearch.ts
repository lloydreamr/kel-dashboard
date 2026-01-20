'use client';

/**
 * useGlobalSearch Hook
 *
 * Searches across companies, products, and research docs.
 * Enabled only when query is 2+ characters.
 * Returns grouped results with navigation hrefs.
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { globalSearchRepo } from '@/lib/repositories';

import type { GlobalSearchResults } from '@/lib/repositories';

export interface UseGlobalSearchResult {
  results: GlobalSearchResults | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for global search across knowledge base entities.
 *
 * @param query - Search query string
 * @returns Search results grouped by type, loading state, and error
 *
 * Edge case behavior:
 * - Query empty (0 chars): Returns { results: null, isLoading: false, error: null }
 * - Query 1 char: Returns { results: null, isLoading: false, error: null }
 * - Query >= 2 chars: Executes search query
 * - Empty results: Returns { results: { companies: [], products: [], research: [], totalCount: 0 }, ... }
 * - Network error: Sets error, component should show toast with retry option
 *
 * @example
 * const { results, isLoading, error } = useGlobalSearch('urc');
 * // results?.companies = [{ id: '...', name: 'URC', type: 'company', href: '/market-intelligence/companies/...' }]
 */
export function useGlobalSearch(query: string): UseGlobalSearchResult {
  const trimmedQuery = query.trim();
  const isEnabled = trimmedQuery.length >= 2;

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.marketIntelligence.globalSearch(trimmedQuery),
    queryFn: () => globalSearchRepo.searchAll(trimmedQuery),
    enabled: isEnabled,
    staleTime: 30000, // 30 seconds - search results can cache briefly
  });

  // When disabled (query < 2 chars), return null results without loading
  if (!isEnabled) {
    return {
      results: null,
      isLoading: false,
      error: null,
    };
  }

  return {
    results: data ?? null,
    isLoading: queryLoading,
    error: queryError instanceof Error ? queryError : null,
  };
}
