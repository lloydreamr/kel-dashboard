'use client';

/**
 * DecisionTimestamp Component
 *
 * Displays when Kel made his decision using relative time format.
 * Pattern follows KelViewedIndicator for consistency.
 *
 * Story 4-8: View Decision Details (Maho)
 */

import { formatRelativeTime } from '@/lib/utils/date';

export interface DecisionTimestampProps {
  /** ISO timestamp of when decision was made */
  createdAt: string;
}

/**
 * Displays "Decided X ago" for decision timestamps.
 * Uses formatRelativeTime for human-readable format.
 */
export function DecisionTimestamp({ createdAt }: DecisionTimestampProps) {
  return (
    <span
      data-testid="decision-timestamp"
      className="text-xs text-muted-foreground"
    >
      Decided {formatRelativeTime(createdAt)}
    </span>
  );
}
