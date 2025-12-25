'use client';

import { Archive } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ArchiveButtonProps {
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * ArchiveButton with confirmation dialog
 *
 * Shows AlertDialog before archiving to prevent accidental deletion.
 * Maho-only component (role check done at parent level).
 */
export function ArchiveButton({ onConfirm, isPending = false }: ArchiveButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="archive-button"
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive hover:border-destructive"
        >
          <Archive className="h-4 w-4 mr-2" />
          {isPending ? 'Archiving...' : 'Archive'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="archive-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this question?</AlertDialogTitle>
          <AlertDialogDescription>
            The question will be moved to the archive. You can restore it later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
