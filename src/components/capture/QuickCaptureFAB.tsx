'use client';

import { Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickCaptureFABProps {
  /** Click handler to open the capture sheet */
  onClick: () => void;
  /** Whether the FAB is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Floating Action Button for quick photo capture.
 * Positioned at bottom-right of the screen for easy thumb access on mobile.
 *
 * Story 10-5: Quick Capture Mode
 */
export function QuickCaptureFAB({
  onClick,
  disabled = false,
  className,
}: QuickCaptureFABProps) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Position: fixed bottom-right with safe area padding
        'fixed bottom-6 right-6 z-50',
        // Size: large touch target (56x56 = 14 * 4)
        'h-14 w-14',
        // Shape: circular
        'rounded-full',
        // Shadow for elevation
        'shadow-lg hover:shadow-xl',
        // Animation
        'transition-all duration-200',
        // Scale effect on hover/active
        'hover:scale-105 active:scale-95',
        className
      )}
      data-testid="quick-capture-fab"
      aria-label="Quick capture photo"
    >
      <Camera className="h-6 w-6" />
    </Button>
  );
}
