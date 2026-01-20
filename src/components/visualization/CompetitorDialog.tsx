'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CompetitorForm } from './CompetitorForm';

import type { CompetitorDataPoint } from '@/types';

interface CompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompetitor?: CompetitorDataPoint | null;
}

export function CompetitorDialog({ open, onOpenChange, editingCompetitor }: CompetitorDialogProps) {
  const mode = editingCompetitor ? 'edit' : 'create';
  const title = mode === 'create' ? 'Add Competitor' : 'Edit Competitor';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="competitor-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new competitor with price and quality scores.'
              : 'Update competitor details and positioning scores.'}
          </DialogDescription>
        </DialogHeader>
        <CompetitorForm
          mode={mode}
          defaultValues={editingCompetitor ?? undefined}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
