'use client';

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

interface RemoveEvidenceDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Evidence title for display */
  evidenceTitle: string;
  /** Callback when removal is confirmed */
  onConfirm: () => void;
  /** Whether removal is in progress */
  isPending?: boolean;
}

/**
 * Confirmation dialog for removing evidence.
 * Uses AlertDialog for accessible modal behavior.
 */
export function RemoveEvidenceDialog({
  open,
  onOpenChange,
  evidenceTitle,
  onConfirm,
  isPending = false,
}: RemoveEvidenceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="evidence-remove-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this evidence?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove &quot;{evidenceTitle}&quot; from this
            question. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="min-h-[48px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            data-testid="evidence-remove-confirm"
            className="min-h-[48px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
