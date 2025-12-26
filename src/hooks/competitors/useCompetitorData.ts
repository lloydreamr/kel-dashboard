/**
 * useCompetitorData Hook
 *
 * TanStack Query hook for fetching all competitor data points.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { competitorsRepo } from '@/lib/repositories/competitors';

import type { CompetitorDataPoint } from '@/types';

/**
 * Hook for fetching all competitor data points.
 * Returns data points ordered by name.
 *
 * @returns Query result with competitor data points array
 *
 * @example
 * const { data: competitors, isLoading, error } = useCompetitorData();
 */
export function useCompetitorData(): UseQueryResult<CompetitorDataPoint[], Error> {
  return useQuery({
    queryKey: queryKeys.competitors.all,
    queryFn: () => competitorsRepo.getAll(),
  });
}
