'use client';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface RestoreButtonProps {
  onRestore: () => void;
  isPending?: boolean;
}

/**
 * RestoreButton for archived questions
 *
 * No confirmation needed - restoring is a safe operation.
 * Maho-only component (role check done at parent level).
 */
export function RestoreButton({ onRestore, isPending = false }: RestoreButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      data-testid="restore-button"
      disabled={isPending}
      onClick={onRestore}
      className="text-muted-foreground hover:text-primary hover:border-primary"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      {isPending ? 'Restoring...' : 'Restore'}
    </Button>
  );
}
