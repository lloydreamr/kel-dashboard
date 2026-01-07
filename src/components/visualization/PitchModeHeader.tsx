/**
 * PitchModeHeader Component
 *
 * Clean, professional header for pitch mode.
 * Displays Kel branding and exit button.
 *
 * Story 11.1: Pitch Mode View
 *
 * @example
 * ```tsx
 * <PitchModeHeader onExit={() => router.push('/visualization')} />
 * ```
 */

'use client';

import { Button } from '@/components/ui/button';

interface PitchModeHeaderProps {
  /** Callback when exit button is clicked */
  onExit: () => void;
}

export function PitchModeHeader({ onExit }: PitchModeHeaderProps) {
  return (
    <header
      data-testid="pitch-mode-header"
      className="sticky top-0 z-50 w-full bg-background border-b border-border"
    >
      <div className="container flex items-center justify-between py-4 px-4 md:px-6">
        {/* Kel branding */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Kel</span>
          <span className="text-muted-foreground hidden sm:inline">
            Competitor Positioning
          </span>
        </div>

        {/* Exit button - 48px touch target */}
        <Button
          variant="outline"
          onClick={onExit}
          data-testid="exit-pitch-mode-button"
          className="min-h-12 px-4"
        >
          Exit Pitch Mode
        </Button>
      </div>
    </header>
  );
}
