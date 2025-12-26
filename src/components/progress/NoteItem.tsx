'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/auth';

import { DeleteNoteDialog } from './DeleteNoteDialog';

import type { MilestoneNote } from '@/types';

interface NoteItemProps {
  note: MilestoneNote;
  onUpdate: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  /** Set to true when update succeeds - NoteItem will close edit mode */
  editSuccess?: boolean;
  /** Called after NoteItem has processed editSuccess and closed edit mode */
  onEditSuccessConsumed?: () => void;
}

export function NoteItem({
  note,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
  editSuccess = false,
  onEditSuccessConsumed,
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Close edit mode when update succeeds (editSuccess becomes true)
  // This pattern is intentional for coordinating with parent component state
   
  useEffect(() => {
    if (editSuccess && isEditing) {
      setIsEditing(false);
      setEditContent(note.content); // Reset to new saved content
      onEditSuccessConsumed?.();
    }
  }, [editSuccess, isEditing, note.content, onEditSuccessConsumed]);

  // Don't render action buttons while profile is loading
  const isOwner = !profileLoading && profile?.id === note.created_by;

  // Author indicator: "You" if own note, otherwise show the other user's name
  // Since we only have 2 users (Maho/Kel), if it's not "You", it's the other one
  const getOtherUserName = (currentRole: string | undefined): string => {
    if (currentRole === 'maho') return 'Kel';
    if (currentRole === 'kel') return 'Maho';
    return 'Other User'; // Fallback for safety
  };

  const authorLabel =
    profile?.id === note.created_by ? 'You' : getOtherUserName(profile?.role);

  // Format timestamp using Intl.DateTimeFormat (respects user's locale)
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(note.created_at));

  const handleSave = () => {
    if (editContent.trim() && editContent !== note.content) {
      onUpdate(note.id, editContent.trim());
      // Note: setIsEditing(false) is called via editSuccess prop
      // DO NOT close edit mode here - wait for mutation success
    }
  };

  const handleDelete = () => {
    onDelete(note.id);
    setShowDeleteDialog(false);
  };

  return (
    <div
      data-testid="note-item"
      className="rounded-lg border border-border bg-card p-4"
    >
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[80px]"
            disabled={isUpdating}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={
                isUpdating ||
                !editContent.trim() ||
                editContent === note.content
              }
              className="min-h-[48px]"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditContent(note.content);
              }}
              disabled={isUpdating}
              className="min-h-[48px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">{authorLabel}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
            {isOwner && !profileLoading && (
              <div className="flex gap-2">
                <button
                  data-testid="note-edit-button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center min-h-[48px] min-w-[48px] hover:text-foreground"
                  aria-label="Edit note"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  data-testid="note-delete-button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center justify-center min-h-[48px] min-w-[48px] hover:text-destructive"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <DeleteNoteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}
