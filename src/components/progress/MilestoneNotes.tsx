'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  useDeleteMilestoneNote,
  useUpdateMilestoneNote,
} from '@/hooks/milestones';

import { AddNoteSection } from './AddNoteSection';
import { NotesList } from './NotesList';

interface MilestoneNotesProps {
  milestoneId: string;
}

export function MilestoneNotes({ milestoneId }: MilestoneNotesProps) {
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  // Track which note should exit edit mode on next render (after successful update)
  const [editSuccessNoteId, setEditSuccessNoteId] = useState<string | null>(
    null
  );

  const updateNote = useUpdateMilestoneNote();
  const deleteNote = useDeleteMilestoneNote();

  const handleUpdate = (noteId: string, content: string) => {
    setUpdatingNoteId(noteId);
    updateNote.mutate(
      { noteId, milestoneId, input: { content } },
      {
        onSuccess: () => {
          toast.success('Note updated');
          setUpdatingNoteId(null);
          setEditSuccessNoteId(noteId); // Signal NoteItem to close edit mode
        },
        onError: () => {
          toast.error('Failed to update note');
          setUpdatingNoteId(null);
          // DO NOT set editSuccessNoteId - keep edit mode open on failure
        },
      }
    );
  };

  const handleDelete = (noteId: string) => {
    setDeletingNoteId(noteId);
    deleteNote.mutate(
      { noteId, milestoneId },
      {
        onSuccess: () => {
          toast.success('Note deleted');
          setDeletingNoteId(null);
        },
        onError: () => {
          toast.error('Failed to delete note');
          setDeletingNoteId(null);
        },
      }
    );
  };

  // Clear edit success signal after it's been consumed
  const handleEditSuccessConsumed = () => {
    setEditSuccessNoteId(null);
  };

  return (
    <div className="mt-6 space-y-4">
      <h4 className="font-medium text-foreground">Notes</h4>
      <NotesList
        milestoneId={milestoneId}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        updatingNoteId={updatingNoteId}
        deletingNoteId={deletingNoteId}
        editSuccessNoteId={editSuccessNoteId}
        onEditSuccessConsumed={handleEditSuccessConsumed}
      />
      <AddNoteSection milestoneId={milestoneId} />
    </div>
  );
}
