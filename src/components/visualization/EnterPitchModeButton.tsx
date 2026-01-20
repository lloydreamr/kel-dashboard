/**
 * EnterPitchModeButton Component
 *
 * Button to activate Pitch Mode for professional distributor presentations.
 * Displays with a presentation icon and outline styling.
 *
 * Story 11.1: Pitch Mode View
 *
 * @example
 * ```tsx
 * const { enterPitchMode } = usePitchMode();
 *
 * <EnterPitchModeButton onClick={enterPitchMode} />
 * ```
 */

'use client';

import { Presentation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnterPitchModeButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function EnterPitchModeButton({
  onClick,
  className,
}: EnterPitchModeButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      data-testid="enter-pitch-mode-button"
      className={cn('min-h-12 gap-2', className)}
    >
      <Presentation className="h-4 w-4" aria-hidden="true" />
      <span>Pitch Mode</span>
    </Button>
  );
}
