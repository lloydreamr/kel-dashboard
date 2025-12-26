/**
 * useMilestones Hook
 *
 * TanStack Query hook for fetching all milestones.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { milestonesRepo } from '@/lib/repositories/milestones';

import type { Milestone } from '@/types';

/**
 * Hook for fetching all milestones (always returns 3 rows).
 *
 * @returns Query result with milestones array
 *
 * @example
 * const { data: milestones, isLoading, error } = useMilestones();
 */
export function useMilestones(): UseQueryResult<Milestone[], Error> {
  return useQuery({
    queryKey: queryKeys.milestones.all,
    queryFn: () => milestonesRepo.getAll(),
  });
}
