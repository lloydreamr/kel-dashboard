/**
 * usePitchSectionMutations Hooks
 *
 * TanStack Query mutation hooks for pitch section CRUD operations.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { pitchSectionsRepo } from '@/lib/repositories';

import type { PitchSection } from '@/types/database';
import type { UpdatePitchSectionInput } from '@/types/pitch';

/**
 * Hook for updating a pitch section's content.
 *
 * @returns Mutation for updating section
 *
 * @example
 * const updateSection = useUpdatePitchSection();
 * updateSection.mutate({ id: 'uuid', updates: { content: 'New content' } });
 */
export function useUpdatePitchSection() {
  const queryClient = useQueryClient();

  return useMutation<
    PitchSection,
    Error,
    { id: string; updates: UpdatePitchSectionInput; pitchDraftId: string }
  >({
    mutationFn: ({ id, updates }) => pitchSectionsRepo.update(id, updates),
    onSuccess: (_, { pitchDraftId }) => {
      // Invalidate sections queries for the draft
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchSections.byDraft(pitchDraftId),
      });
      // Also invalidate draft with sections query
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.withSections(pitchDraftId),
      });
    },
    onError: (error) => {
      toast.error('Failed to update section', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a pitch section.
 *
 * @returns Mutation for deleting section
 *
 * @example
 * const deleteSection = useDeletePitchSection();
 * deleteSection.mutate({ id: 'uuid', pitchDraftId: 'draft-uuid' });
 */
export function useDeletePitchSection() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; pitchDraftId: string }>({
    mutationFn: ({ id }) => pitchSectionsRepo.delete(id),
    onSuccess: (_, { pitchDraftId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchSections.byDraft(pitchDraftId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.withSections(pitchDraftId),
      });
      toast.success('Section deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete section', {
        description: error.message,
      });
    },
  });
}
