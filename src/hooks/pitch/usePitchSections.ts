/**
 * usePitchSections Hook
 *
 * TanStack Query hook for fetching pitch sections for a draft.
 * Includes option to fetch with sources.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { pitchSectionsRepo } from '@/lib/repositories';

import type { PitchSection } from '@/types/database';
import type { PitchSectionWithSources } from '@/types/pitch';

interface UsePitchSectionsOptions {
  /** Include sources in the response */
  withSources?: boolean;
}

/**
 * Hook for fetching pitch sections for a draft.
 *
 * @param pitchDraftId - Pitch draft ID
 * @param options - Fetch options
 * @returns Query result with sections array
 *
 * @example
 * const { data: sections } = usePitchSections('draft-uuid');
 * const { data: sectionsWithSources } = usePitchSections('draft-uuid', { withSources: true });
 */
export function usePitchSections(
  pitchDraftId: string | undefined,
  options: UsePitchSectionsOptions = {}
) {
  const { withSources = false } = options;

  return useQuery<PitchSection[] | PitchSectionWithSources[], Error>({
    queryKey: queryKeys.pitchSections.byDraft(pitchDraftId ?? ''),
    queryFn: () =>
      withSources
        ? pitchSectionsRepo.getByDraftIdWithSources(pitchDraftId!)
        : pitchSectionsRepo.getByDraftId(pitchDraftId!),
    enabled: !!pitchDraftId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
