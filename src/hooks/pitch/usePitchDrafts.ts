/**
 * usePitchDrafts Hook
 *
 * TanStack Query hook for fetching all pitch drafts with section counts.
 * Returns drafts ordered by creation date (newest first).
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { pitchDraftsRepo } from '@/lib/repositories';

import type { PitchDraftWithSectionCount } from '@/types/pitch';

/**
 * Hook for fetching all pitch drafts with section counts.
 * Includes section_count for displaying progress indicators.
 *
 * @returns Query result with pitch drafts array (includes section_count)
 *
 * @example
 * const { data: drafts, isLoading, error } = usePitchDrafts();
 * // Each draft has: id, title, status, section_count, etc.
 */
export function usePitchDrafts() {
  return useQuery<PitchDraftWithSectionCount[], Error>({
    queryKey: queryKeys.pitchDrafts.all,
    queryFn: () => pitchDraftsRepo.getAllWithCounts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
