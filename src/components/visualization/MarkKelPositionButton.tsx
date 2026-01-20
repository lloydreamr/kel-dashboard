/**
 * MarkKelPositionButton Component
 *
 * Button for opening the Kel position dialog.
 * Only visible to Maho (role check handled in parent).
 * Text changes based on whether Kel position already exists.
 */

'use client';

import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MarkKelPositionButtonProps {
  onClick: () => void;
  hasExistingPosition: boolean;
}

export function MarkKelPositionButton({ onClick, hasExistingPosition }: MarkKelPositionButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="min-h-12 w-full whitespace-nowrap sm:w-auto gap-2"
      data-testid="mark-kel-position-button"
    >
      <Star className="h-4 w-4" aria-hidden="true" />
      {hasExistingPosition ? 'Update Kel Position' : 'Set Kel Position'}
    </Button>
  );
}
