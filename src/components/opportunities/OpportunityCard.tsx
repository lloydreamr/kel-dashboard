'use client';

/**
 * OpportunityCard Component
 *
 * Displays an AI-identified opportunity summary with title, category badge,
 * confidence indicator, and brief description.
 * Clickable card that navigates to opportunity detail page.
 */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { cn } from '@/lib/utils';
import type { Opportunity, OpportunityCategory } from '@/lib/repositories/opportunities';
import {
  getConfidenceLevel,
  OPPORTUNITY_CATEGORY_LABELS,
  OPPORTUNITY_CATEGORY_COLORS,
  CONFIDENCE_COLORS,
} from '@/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const router = useRouter();
  const confidenceLevel = getConfidenceLevel(opportunity.confidence_score);
  // Cast category to typed enum (database returns string, but values are constrained)
  const category = opportunity.category as OpportunityCategory;

  // Navigation handler - follows CompanyCard pattern
  const handleClick = useCallback(() => {
    router.push(`/market-intelligence/opportunities/${opportunity.id}`);
  }, [router, opportunity.id]);

  // Keyboard accessibility - Enter/Space activate the card
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid="opportunity-card"
      aria-label={`View ${opportunity.title} opportunity`}
      className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {/* Category Badge */}
      <span
        className={cn(
          'inline-block px-2 py-1 text-xs font-medium rounded',
          OPPORTUNITY_CATEGORY_COLORS[category]
        )}
      >
        {OPPORTUNITY_CATEGORY_LABELS[category]}
      </span>

      {/* Title */}
      <h3 className="mt-2 font-semibold text-foreground">{opportunity.title}</h3>

      {/* Description (truncated) */}
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
        {opportunity.description || 'No description available'}
      </p>

      {/* Confidence Indicator */}
      <div className="mt-3 flex items-center gap-2">
        <span className={cn('text-sm font-medium', CONFIDENCE_COLORS[confidenceLevel])}>
          {confidenceLevel === 'high' && '🟢 High'}
          {confidenceLevel === 'medium' && '🟡 Medium'}
          {confidenceLevel === 'low' && '🔴 Low'}
        </span>
        <span className="text-xs text-muted-foreground">
          ({Math.round(opportunity.confidence_score * 100)}%)
        </span>
      </div>
    </div>
  );
}
