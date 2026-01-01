/**
 * FreshnessWarningBadge Component
 *
 * Displays a warning badge when a category has stale questions.
 * Shows the count of stale items and is clickable for navigation.
 */

'use client';

import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { QuestionCategory } from '@/types/question';

interface FreshnessWarningBadgeProps {
  staleCount: number;
  category: QuestionCategory;
  onClick?: () => void;
}

export function FreshnessWarningBadge({
  staleCount,
  category,
  onClick,
}: FreshnessWarningBadgeProps) {
  // Render nothing if no stale items
  if (staleCount === 0) return null;

  const message =
    staleCount === 1 ? '1 item needs attention' : `${staleCount} items need attention`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 min-h-[48px] px-3 cursor-pointer text-warning border-warning/30 bg-warning/10 hover:bg-warning/20 transition-colors"
            data-testid="freshness-warning-badge"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <AlertTriangle className="h-4 w-4" />
            <span data-testid="freshness-count">{message}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to view stale {category} questions</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
