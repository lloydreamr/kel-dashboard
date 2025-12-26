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

import type { CompetitorDataPoint } from '@/types';

interface DeleteCompetitorDialogProps {
  competitor: CompetitorDataPoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteCompetitorDialog({
  competitor,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCompetitorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="delete-competitor-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Competitor?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {competitor?.name ?? 'this competitor'} from the chart? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[48px] min-w-[100px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid="competitor-delete-confirm"
            className="min-h-[48px] min-w-[100px]"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
