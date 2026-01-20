'use client';

/**
 * StaleDataBadge Component
 *
 * Displays a warning indicator for data older than the staleness threshold.
 * Returns null if data is not stale (conditional rendering).
 */

import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isStale, getStalenessMessage } from '@/lib/utils/staleness';

interface StaleDataBadgeProps {
  /** The date string to check for staleness */
  updatedAt: string | null | undefined;
  /** Optional custom threshold in days (default: 14) */
  thresholdDays?: number;
}

export function StaleDataBadge({
  updatedAt,
  thresholdDays = 14,
}: StaleDataBadgeProps) {
  // Return null if data is not stale (conditional rendering)
  if (!isStale(updatedAt, thresholdDays)) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="flex items-center gap-1 text-xs text-warning border-warning/30 bg-warning/10"
            data-testid="stale-data-indicator"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Stale</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent data-testid="stale-data-tooltip">
          <p>{getStalenessMessage(updatedAt)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
