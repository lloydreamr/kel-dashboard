'use client';

/**
 * ExploreAlternativesButton Component
 *
 * Toggle button for expanding the alternatives reasoning panel.
 * Uses collaborative language per UX7: "Explore Alternatives" (not "Reject").
 *
 * 48px touch target per UX spec.
 * Secondary button style (border, not filled).
 */

import { cn } from '@/lib/utils';

export interface ExploreAlternativesButtonProps {
  /** Whether the alternatives panel is currently expanded */
  expanded: boolean;
  /** Callback to toggle the panel */
  onToggle: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional additional className */
  className?: string;
}

/**
 * ExploreAlternativesButton - Button to toggle the alternatives panel.
 *
 * When clicked, expands/collapses the inline reasoning panel.
 */
export function ExploreAlternativesButton({
  expanded,
  onToggle,
  disabled = false,
  className,
}: ExploreAlternativesButtonProps) {
  return (
    <button
      type="button"
      data-testid="explore-alternatives-button"
      aria-expanded={expanded}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        // Base styles
        'min-h-[48px] px-4 py-2 rounded-lg font-medium transition-colors',
        // Secondary button style (border, not filled)
        'border border-border text-foreground',
        // Hover state
        'hover:bg-muted',
        // Focus ring
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Disabled state
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Expanded state visual feedback
        expanded && 'bg-muted',
        className
      )}
    >
      Explore Alternatives
    </button>
  );
}
