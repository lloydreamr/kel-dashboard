'use client';

/**
 * ConfidenceBadge Component
 *
 * Visual badge showing AI confidence level with color coding.
 * High (green) = 80%+, Medium (yellow) = 50-79%, Low (red) = <50%
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 *
 * @example
 * ```tsx
 * <ConfidenceBadge score={0.85} />
 * <ConfidenceBadge score={0.65} showLabel />
 * ```
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getConfidenceLevel } from '@/types/pitch';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  /** Confidence score (0-1) */
  score: number | null;
  /** Whether to show the label (e.g., "High") alongside percentage */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Color mapping for confidence levels
 */
const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
  unknown: 'bg-gray-100 text-gray-600 border-gray-200',
};

/**
 * Labels for confidence levels
 */
const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  unknown: 'Unknown',
};

/**
 * Tooltips for confidence levels
 */
const CONFIDENCE_TOOLTIPS: Record<string, string> = {
  high: 'Strong evidence from multiple sources',
  medium: 'Good evidence with some assumptions',
  low: 'Limited evidence, may need validation',
  unknown: 'Confidence not available',
};

/**
 * Visual badge showing AI content confidence level.
 */
export function ConfidenceBadge({
  score,
  showLabel = false,
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const percentage = score !== null ? Math.round(score * 100) : null;

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(CONFIDENCE_COLORS[level], className)}
      data-testid="confidence-badge"
    >
      {percentage !== null ? (
        <>
          {showLabel && <span>{CONFIDENCE_LABELS[level]}: </span>}
          {percentage}%
        </>
      ) : (
        CONFIDENCE_LABELS[level]
      )}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <p>{CONFIDENCE_TOOLTIPS[level]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
