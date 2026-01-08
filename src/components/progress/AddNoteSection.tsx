'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCreateMilestoneNote } from '@/hooks/milestones';

import { NoteInput } from './NoteInput';

interface AddNoteSectionProps {
  milestoneId: string;
}

export function AddNoteSection({ milestoneId }: AddNoteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const createNote = useCreateMilestoneNote();

  const handleSave = (content: string) => {
    createNote.mutate(
      { milestone_id: milestoneId, content },
      {
        onSuccess: () => {
          toast.success('Note added');
          setIsExpanded(false);
        },
        onError: () => {
          toast.error('Failed to add note');
        },
      }
    );
  };

  if (isExpanded) {
    return (
      <NoteInput
        onSave={handleSave}
        onCancel={() => setIsExpanded(false)}
        isPending={createNote.isPending}
      />
    );
  }

  return (
    <Button
      data-testid="add-note-button"
      variant="outline"
      onClick={() => setIsExpanded(true)}
      className="min-h-12 w-full"
    >
      <Plus className="h-4 w-4" />
      Add Note
    </Button>
  );
}
