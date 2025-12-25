'use client';

import { cn } from '@/lib/utils';

import type { ConstraintPreset } from '@/types/decision';

/**
 * Labels for each constraint preset type.
 * Displayed on the chip UI.
 */
const CONSTRAINT_LABELS: Record<ConstraintPreset, string> = {
  price: 'Price',
  volume: 'Volume',
  risk: 'Risk',
  timeline: 'Timeline',
};

export interface ConstraintChipProps {
  /** The constraint type to display */
  type: ConstraintPreset;
  /** Whether this chip is currently selected */
  selected: boolean;
  /** Callback when chip is toggled */
  onToggle: () => void;
  /** Optional additional className */
  className?: string;
}

/**
 * ConstraintChip - Toggle-able chip for selecting constraint types.
 *
 * Uses role="checkbox" for accessibility - chips represent a multi-select
 * pattern where multiple constraints can be selected simultaneously.
 *
 * Touch target: 48px minimum height per UX spec.
 */
export function ConstraintChip({
  type,
  selected,
  onToggle,
  className,
}: ConstraintChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`${CONSTRAINT_LABELS[type]} constraint`}
      data-testid={`constraint-chip-${type}`}
      onClick={onToggle}
      className={cn(
        // Base styles
        'min-h-[48px] px-4 py-2 rounded-full font-medium transition-colors',
        // Focus ring
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // State-based styles
        selected
          ? 'bg-success text-success-foreground'
          : 'border border-border text-muted-foreground hover:bg-muted',
        className
      )}
    >
      {CONSTRAINT_LABELS[type]}
    </button>
  );
}
