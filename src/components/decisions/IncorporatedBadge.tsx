'use client';

/**
 * IncorporatedBadge Component
 *
 * Badge indicating that Maho has incorporated Kel's constraint feedback.
 * Displayed when decision.incorporated_at is set.
 *
 * Optionally shows relative timestamp when incorporatedAt is provided.
 *
 * Uses success color scheme to indicate positive completion state.
 *
 * Story 4-9: Mark Constraint as Incorporated
 */

import { formatRelativeTime } from '@/lib/utils/date';

export interface IncorporatedBadgeProps {
  /** Optional additional className */
  className?: string;
  /** Optional timestamp when constraint was incorporated */
  incorporatedAt?: string;
}

/**
 * IncorporatedBadge - Badge with checkmark icon, "Incorporated" text, and optional timestamp.
 */
export function IncorporatedBadge({
  className,
  incorporatedAt,
}: IncorporatedBadgeProps) {
  return (
    <span
      data-testid="incorporated-badge"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium ${className ?? ''}`}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Incorporated
      {incorporatedAt && (
        <span
          data-testid="incorporated-timestamp"
          className="text-muted-foreground"
        >
          {formatRelativeTime(incorporatedAt)}
        </span>
      )}
    </span>
  );
}
