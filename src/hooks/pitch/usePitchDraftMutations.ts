/**
 * usePitchDraftMutations Hooks
 *
 * TanStack Query mutation hooks for pitch draft CRUD operations.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { pitchDraftsRepo } from '@/lib/repositories';

import type { PitchDraft } from '@/types/database';
import type {
  CreatePitchDraftInput,
  UpdatePitchDraftInput,
  PitchDraftStatus,
} from '@/types/pitch';

/**
 * Hook for creating a new pitch draft.
 *
 * @returns Mutation for creating pitch draft
 *
 * @example
 * const createDraft = useCreatePitchDraft();
 * createDraft.mutate({ title: 'My Pitch', template_type: 'distributor' });
 */
export function useCreatePitchDraft() {
  const queryClient = useQueryClient();

  return useMutation<PitchDraft, Error, CreatePitchDraftInput>({
    mutationFn: (input) => pitchDraftsRepo.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pitchDrafts.all });
      toast.success(`Created pitch: ${data.title}`);
    },
    onError: (error) => {
      toast.error('Failed to create pitch draft', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating a pitch draft.
 *
 * @returns Mutation for updating pitch draft
 *
 * @example
 * const updateDraft = useUpdatePitchDraft();
 * updateDraft.mutate({ id: 'uuid', updates: { title: 'New Title' } });
 */
export function useUpdatePitchDraft() {
  const queryClient = useQueryClient();

  return useMutation<
    PitchDraft,
    Error,
    { id: string; updates: UpdatePitchDraftInput }
  >({
    mutationFn: ({ id, updates }) => pitchDraftsRepo.update(id, updates),
    onSuccess: (data) => {
      // Invalidate list and specific draft queries
      queryClient.invalidateQueries({ queryKey: queryKeys.pitchDrafts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.byId(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.withSections(data.id),
      });
      toast.success('Pitch draft updated');
    },
    onError: (error) => {
      toast.error('Failed to update pitch draft', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating pitch draft status.
 *
 * @returns Mutation for updating status
 *
 * @example
 * const updateStatus = useUpdatePitchDraftStatus();
 * updateStatus.mutate({ id: 'uuid', status: 'review' });
 */
export function useUpdatePitchDraftStatus() {
  const queryClient = useQueryClient();

  return useMutation<PitchDraft, Error, { id: string; status: PitchDraftStatus }>({
    mutationFn: ({ id, status }) => pitchDraftsRepo.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pitchDrafts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.byId(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.withSections(data.id),
      });

      const statusLabels: Record<PitchDraftStatus, string> = {
        draft: 'Draft',
        ready: 'Ready for Export',
        exported: 'Exported',
      };
      toast.success(`Status updated to ${statusLabels[data.status as PitchDraftStatus]}`);
    },
    onError: (error) => {
      toast.error('Failed to update status', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for deleting a pitch draft.
 *
 * @returns Mutation for deleting pitch draft
 *
 * @example
 * const deleteDraft = useDeletePitchDraft();
 * deleteDraft.mutate('uuid');
 */
export function useDeletePitchDraft() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => pitchDraftsRepo.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pitchDrafts.all });
      queryClient.removeQueries({ queryKey: queryKeys.pitchDrafts.byId(id) });
      queryClient.removeQueries({
        queryKey: queryKeys.pitchDrafts.withSections(id),
      });
      toast.success('Pitch draft deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete pitch draft', {
        description: error.message,
      });
    },
  });
}
