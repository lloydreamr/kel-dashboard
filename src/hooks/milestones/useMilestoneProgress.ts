/**
 * useMilestoneProgress Hook
 *
 * TanStack Query hook for fetching milestone progress by category.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { milestonesRepo } from '@/lib/repositories/milestones';

import type { ClarityCategory, MilestoneProgress } from '@/types';

/**
 * Hook for fetching progress for a specific clarity category.
 * Calculates approved vs total questions in the category.
 *
 * @param category - Clarity category
 * @returns Query result with progress data
 *
 * @example
 * const { data: progress } = useMilestoneProgress('market');
 * // progress: { total: 50, approved: 30, percentage: 60 }
 */
export function useMilestoneProgress(
  category: ClarityCategory
): UseQueryResult<MilestoneProgress, Error> {
  return useQuery({
    queryKey: queryKeys.milestones.progress(category),
    queryFn: () => milestonesRepo.getProgress(category),
  });
}
