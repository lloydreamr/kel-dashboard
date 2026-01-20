/**
 * useMilestoneNoteMutations Hook
 *
 * TanStack Query mutation hooks for milestone note CRUD operations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useOfflineGuard } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';
import { milestoneNotesRepo } from '@/lib/repositories/milestones';

import type {
  CreateMilestoneNoteInput,
  UpdateMilestoneNoteInput,
} from '@/types/milestone';

/**
 * Hook for creating a milestone note.
 * Automatically invalidates milestone notes queries on success.
 *
 * @returns Mutation result
 *
 * @example
 * const createNote = useCreateMilestoneNote();
 * await createNote.mutateAsync({ milestone_id: '...', content: 'Note text' });
 */
export function useCreateMilestoneNote() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: (input: CreateMilestoneNoteInput) => {
      guardOffline(); // Throws OfflineError if offline
      return milestoneNotesRepo.createNote(input);
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific milestone's notes
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestoneNotes.byMilestone(variables.milestone_id),
      });
    },
  });
}

/**
 * Hook for updating a milestone note.
 * Automatically invalidates milestone notes queries on success.
 *
 * @returns Mutation result
 *
 * @example
 * const updateNote = useUpdateMilestoneNote();
 * await updateNote.mutateAsync({
 *   noteId: '...',
 *   milestoneId: '...',
 *   content: 'Updated text'
 * });
 */
export function useUpdateMilestoneNote() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      milestoneId: string;
      input: UpdateMilestoneNoteInput;
    }) => {
      guardOffline(); // Throws OfflineError if offline
      return milestoneNotesRepo.updateNote(noteId, input);
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific milestone's notes
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestoneNotes.byMilestone(variables.milestoneId),
      });
    },
  });
}

/**
 * Hook for deleting a milestone note.
 * Automatically invalidates milestone notes queries on success.
 *
 * @returns Mutation result
 *
 * @example
 * const deleteNote = useDeleteMilestoneNote();
 * await deleteNote.mutateAsync({ noteId: '...', milestoneId: '...' });
 */
export function useDeleteMilestoneNote() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: ({ noteId }: { noteId: string; milestoneId: string }) => {
      guardOffline(); // Throws OfflineError if offline
      return milestoneNotesRepo.deleteNote(noteId);
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific milestone's notes
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestoneNotes.byMilestone(variables.milestoneId),
      });
    },
  });
}
