/**
 * usePitchDraft Hook
 *
 * TanStack Query hook for fetching a single pitch draft by ID.
 * Includes option to fetch with sections.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { pitchDraftsRepo } from '@/lib/repositories';

import type { PitchDraft } from '@/types/database';
import type { PitchDraftWithSections } from '@/types/pitch';

interface UsePitchDraftOptions {
  /** Include sections and sources in the response */
  withSections?: boolean;
}

/**
 * Hook for fetching a single pitch draft.
 *
 * @param id - Pitch draft ID
 * @param options - Fetch options (withSections)
 * @returns Query result with pitch draft
 *
 * @example
 * // Fetch draft only
 * const { data: draft } = usePitchDraft('uuid');
 *
 * // Fetch draft with sections
 * const { data: draft } = usePitchDraft('uuid', { withSections: true });
 */
export function usePitchDraft(
  id: string | undefined,
  options: UsePitchDraftOptions = {}
) {
  const { withSections = false } = options;

  return useQuery<PitchDraft | PitchDraftWithSections, Error>({
    queryKey: withSections
      ? queryKeys.pitchDrafts.withSections(id ?? '')
      : queryKeys.pitchDrafts.byId(id ?? ''),
    queryFn: () =>
      withSections
        ? pitchDraftsRepo.getByIdWithSections(id!)
        : pitchDraftsRepo.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
