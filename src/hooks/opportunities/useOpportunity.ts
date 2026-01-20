/**
 * useOpportunity Hook
 *
 * TanStack Query hook for fetching a single opportunity by ID.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { opportunitiesRepo, type Opportunity } from '@/lib/repositories/opportunities';

/**
 * Hook for fetching a single opportunity by ID.
 *
 * @param id - Opportunity UUID
 * @returns Query result with opportunity data
 *
 * @example
 * const { data: opportunity, isLoading, error } = useOpportunity(id);
 */
export function useOpportunity(id: string): UseQueryResult<Opportunity, Error> {
  return useQuery({
    queryKey: queryKeys.opportunities.byId(id),
    queryFn: () => opportunitiesRepo.getById(id),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
