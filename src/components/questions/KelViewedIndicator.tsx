'use client';

import { formatRelativeTime } from '@/lib/utils/date';

export interface KelViewedIndicatorProps {
  viewedAt: string | null;
}

/**
 * Displays "Kel viewed X ago" indicator when Kel has viewed the question.
 * Only shows when viewedAt has a value.
 */
export function KelViewedIndicator({ viewedAt }: KelViewedIndicatorProps) {
  if (!viewedAt) {
    return null;
  }

  return (
    <div
      data-testid="kel-viewed-indicator"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-success" />
      <span>Kel viewed {formatRelativeTime(viewedAt)}</span>
    </div>
  );
}
