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

import type { ClarityCategory } from '@/types';

interface MarkCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ClarityCategory;
  onConfirm: () => void;
  isPending?: boolean;
}

const CATEGORY_LABELS: Record<ClarityCategory, string> = {
  market: 'Market',
  product: 'Product',
  distribution: 'Distribution',
};

export function MarkCompleteDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
  isPending = false,
}: MarkCompleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="milestone-complete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Mark {CATEGORY_LABELS[category]} clarity as complete?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This indicates Kel has approved the formal clarity document for{' '}
            {CATEGORY_LABELS[category]}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="min-h-[48px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            data-testid="milestone-complete-confirm"
            className="min-h-[48px]"
          >
            {isPending ? 'Marking complete...' : 'Mark Complete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
