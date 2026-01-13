'use client';

/**
 * useOpportunities Hook
 *
 * TanStack Query hook for fetching all AI-identified opportunities.
 * Returns opportunities ordered by confidence score (highest first).
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { opportunitiesRepo, type Opportunity } from '@/lib/repositories/opportunities';

/**
 * Hook for fetching all opportunities.
 * Returns opportunities ordered by confidence score (highest first).
 *
 * @returns Query result with opportunities array
 *
 * @example
 * const { data: opportunities, isLoading, error } = useOpportunities();
 */
export function useOpportunities(): UseQueryResult<Opportunity[], Error> {
  return useQuery({
    queryKey: queryKeys.opportunities.all,
    queryFn: () => opportunitiesRepo.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - opportunities don't change frequently
  });
}
