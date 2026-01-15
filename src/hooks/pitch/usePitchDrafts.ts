/**
 * usePitchDrafts Hook
 *
 * TanStack Query hook for fetching all pitch drafts.
 * Returns drafts ordered by creation date (newest first).
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { pitchDraftsRepo } from '@/lib/repositories';

import type { PitchDraft } from '@/types/database';

/**
 * Hook for fetching all pitch drafts.
 *
 * @returns Query result with pitch drafts array
 *
 * @example
 * const { data: drafts, isLoading, error } = usePitchDrafts();
 */
export function usePitchDrafts() {
  return useQuery<PitchDraft[], Error>({
    queryKey: queryKeys.pitchDrafts.all,
    queryFn: () => pitchDraftsRepo.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
