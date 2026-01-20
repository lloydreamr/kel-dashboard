/**
 * useMilestoneNotes Hook
 *
 * TanStack Query hook for fetching notes for a specific milestone.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { milestoneNotesRepo } from '@/lib/repositories/milestones';

import type { MilestoneNote } from '@/types';

/**
 * Hook for fetching all notes for a milestone.
 *
 * @param milestoneId - Milestone ID
 * @returns Query result with notes array
 *
 * @example
 * const { data: notes, isLoading } = useMilestoneNotes(milestoneId);
 */
export function useMilestoneNotes(
  milestoneId: string
): UseQueryResult<MilestoneNote[], Error> {
  return useQuery({
    queryKey: queryKeys.milestoneNotes.byMilestone(milestoneId),
    queryFn: () => milestoneNotesRepo.getNotesByMilestone(milestoneId),
    enabled: !!milestoneId,
  });
}
