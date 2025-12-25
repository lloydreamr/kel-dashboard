'use client';

/**
 * DiscardDraftDialog Component
 *
 * Confirmation dialog shown when user attempts to navigate away
 * or close a panel with unsaved draft content. Uses AlertDialog
 * for accessible modal behavior.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DiscardDraftDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when discard is confirmed */
  onConfirm: () => void;
}

/**
 * Confirmation dialog for discarding unsaved draft responses.
 * Uses AlertDialog for accessible modal behavior.
 */
export function DiscardDraftDialog({
  open,
  onOpenChange,
  onConfirm,
}: DiscardDraftDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="discard-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Your draft response will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[48px]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid="discard-confirm-button"
            className="min-h-[48px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
