'use client';

/**
 * ConstraintDisplay Component
 *
 * Read-only display of constraint chips and optional context text.
 * Used in DecisionSection to show Kel's constraint selections.
 *
 * Unlike ConstraintChip (interactive), this is purely for display:
 * - No toggle behavior
 * - No touch targets needed
 * - Subtle styling (bg-success/10) vs filled selected state
 */

import type { Constraint, ConstraintPreset } from '@/types/decision';

/**
 * Labels for each constraint preset type.
 */
const CONSTRAINT_LABELS: Record<ConstraintPreset, string> = {
  price: 'Price',
  volume: 'Volume',
  risk: 'Risk',
  timeline: 'Timeline',
};

export interface ConstraintDisplayProps {
  /** Array of constraints to display */
  constraints: Constraint[];
  /** Optional context text to show below chips */
  context?: string;
}

/**
 * ConstraintDisplay - Read-only display of constraint chips.
 *
 * Shows constraint types as non-interactive chips with optional context text below.
 * Custom constraint types (not in CONSTRAINT_LABELS) are displayed as-is.
 */
export function ConstraintDisplay({
  constraints,
  context,
}: ConstraintDisplayProps) {
  return (
    <div data-testid="constraint-display">
      {constraints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {constraints.map((constraint, index) => {
            const label =
              CONSTRAINT_LABELS[constraint.type as ConstraintPreset] ??
              constraint.type;

            return (
              <span
                key={`${constraint.type}-${index}`}
                data-testid={`constraint-display-chip-${constraint.type}`}
                className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium"
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

      {context && (
        <p
          data-testid="constraint-display-context"
          className="mt-2 text-sm text-muted-foreground"
        >
          {context}
        </p>
      )}
    </div>
  );
}
