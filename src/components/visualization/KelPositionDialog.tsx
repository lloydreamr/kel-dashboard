/**
 * KelPositionDialog Component
 *
 * Dialog wrapper for KelPositionForm.
 * Shows "Set" or "Update" title based on whether position exists.
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { KelPositionForm } from './KelPositionForm';

import type { CompetitorDataPoint } from '@/types';

interface KelPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPosition?: CompetitorDataPoint;
}

export function KelPositionDialog({ open, onOpenChange, existingPosition }: KelPositionDialogProps) {
  const title = existingPosition ? "Update Kel's Position" : "Set Kel's Target Position";
  const description = existingPosition
    ? 'Adjust the price and quality scores for your target market position.'
    : 'Set the price and quality scores for your target market position on the chart.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="kel-position-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <KelPositionForm
          defaultValues={existingPosition}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
