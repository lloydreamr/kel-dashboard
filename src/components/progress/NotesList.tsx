'use client';

import { useMilestoneNotes } from '@/hooks/milestones';

import { NoteItem } from './NoteItem';

interface NotesListProps {
  milestoneId: string;
  onUpdate: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
  updatingNoteId?: string | null;
  deletingNoteId?: string | null;
  /** ID of note that just had a successful update */
  editSuccessNoteId?: string | null;
  /** Called after NoteItem has consumed the edit success signal */
  onEditSuccessConsumed?: () => void;
}

export function NotesList({
  milestoneId,
  onUpdate,
  onDelete,
  updatingNoteId,
  deletingNoteId,
  editSuccessNoteId,
  onEditSuccessConsumed,
}: NotesListProps) {
  const { data: notes, isLoading, error } = useMilestoneNotes(milestoneId);

  // Loading skeleton - uses project pattern (inline animate-pulse, NOT Skeleton component)
  if (isLoading) {
    return (
      <div
        data-testid="notes-list-skeleton"
        className="space-y-3"
        aria-busy="true"
        aria-label="Loading notes"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 animate-pulse"
          >
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="mt-2 flex items-center gap-2">
              <div className="h-3 w-12 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state - show friendly error message
  if (error) {
    return (
      <div
        data-testid="notes-list-error"
        className="flex items-center justify-center py-8"
      >
        <p className="text-muted-foreground">
          Unable to load notes. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state - collapsed view, just return null since AddNoteSection provides the CTA
  // (Previous design showed bordered empty state that took too much vertical space)
  if (!notes || notes.length === 0) {
    return null;
  }

  // Notes are returned newest-first from repository (order by created_at DESC)
  return (
    <div data-testid="notes-list" className="space-y-3">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isUpdating={updatingNoteId === note.id}
          isDeleting={deletingNoteId === note.id}
          editSuccess={editSuccessNoteId === note.id}
          onEditSuccessConsumed={onEditSuccessConsumed}
        />
      ))}
    </div>
  );
}
