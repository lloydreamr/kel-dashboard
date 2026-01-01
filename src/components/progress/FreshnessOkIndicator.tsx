/**
 * FreshnessOkIndicator Component
 *
 * Displays a positive indicator when all questions in a category are fresh.
 * Provides feedback that data maintenance is up to date.
 */

'use client';

import { CheckCircle } from 'lucide-react';

interface FreshnessOkIndicatorProps {
  staleCount: number;
}

export function FreshnessOkIndicator({ staleCount }: FreshnessOkIndicatorProps) {
  // Only render when all data is fresh
  if (staleCount > 0) return null;

  return (
    <div
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
      data-testid="freshness-ok-indicator"
    >
      <CheckCircle className="h-4 w-4 text-green-500" />
      <span>All data current</span>
    </div>
  );
}
