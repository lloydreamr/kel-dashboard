'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NoteInputProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  isPending?: boolean;
  initialValue?: string;
}

export function NoteInput({
  onSave,
  onCancel,
  isPending = false,
  initialValue = '',
}: NoteInputProps) {
  const [content, setContent] = useState(initialValue);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        data-testid="note-input-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add your note..."
        className="min-h-[80px]"
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button
          data-testid="note-save-button"
          onClick={handleSave}
          disabled={isPending || !content.trim()}
          className="min-h-[48px]"
        >
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button
          data-testid="note-cancel-button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="min-h-[48px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
