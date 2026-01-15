'use client';

/**
 * MarketGapsSection Component
 *
 * Displays AI-identified market gap opportunities within a pitch section.
 * Shows opportunities with title, description, confidence score, and
 * supporting evidence. Uses live data via useOpportunities hook.
 *
 * Story 18-2: Dynamic Data Integration in Pitch
 *
 * @example
 * ```tsx
 * <MarketGapsSection onRefresh={() => refetch()} />
 * ```
 */

import { RefreshCw, TrendingUp } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SupportingEvidenceSection } from '@/components/opportunities/SupportingEvidenceSection';
import { useOpportunities } from '@/hooks/opportunities';
import { cn } from '@/lib/utils';
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_DESCRIPTIONS,
} from '@/types/pitch';
import {
  getConfidenceLevel,
  OPPORTUNITY_CATEGORY_LABELS,
  OPPORTUNITY_CATEGORY_COLORS,
  CONFIDENCE_COLORS,
} from '@/types';

import type { Opportunity } from '@/lib/repositories/opportunities';
import type { OpportunityCategory } from '@/lib/repositories/opportunities';

interface MarketGapsSectionProps {
  /** Maximum number of opportunities to display */
  maxItems?: number;
  /** Optional callback when data is refreshed */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pitch section displaying market gap opportunities.
 * Filters to show only 'market_gap' category by default.
 */
export function MarketGapsSection({
  maxItems = 3,
  onRefresh,
  className,
}: MarketGapsSectionProps) {
  const {
    data: opportunities,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useOpportunities();

  const label = SECTION_TYPE_LABELS.market_gaps;
  const description = SECTION_TYPE_DESCRIPTIONS.market_gaps;

  // Filter to market_gap category and limit results
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];
    return opportunities
      .filter((o) => o.category === 'market_gap')
      .slice(0, maxItems);
  }, [opportunities, maxItems]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  return (
    <Card className={className} data-testid="pitch-section-market_gaps">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="min-h-[48px] min-w-[48px] shrink-0"
            data-testid="refresh-market-gaps"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <MarketGapsSkeleton />
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            data-testid="market-gaps-error"
          >
            <p className="text-sm text-destructive mb-2">
              Failed to load opportunities data
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="min-h-[48px]"
            >
              Try again
            </Button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <MarketGapsEmptyState />
        ) : (
          <div
            className="space-y-4"
            data-testid="market-gaps-list"
          >
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual opportunity display card for pitch context.
 * Simplified version of the main OpportunityCard - no navigation,
 * includes supporting evidence inline.
 */
function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const confidenceLevel = getConfidenceLevel(opportunity.confidence_score);
  const category = opportunity.category as OpportunityCategory;

  return (
    <div
      className="p-4 rounded-lg border border-border bg-card"
      data-testid="pitch-opportunity-card"
    >
      {/* Header: Category Badge + Confidence */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge
          variant="secondary"
          className={cn('text-xs', OPPORTUNITY_CATEGORY_COLORS[category])}
        >
          {OPPORTUNITY_CATEGORY_LABELS[category]}
        </Badge>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className={cn('text-sm font-medium', CONFIDENCE_COLORS[confidenceLevel])}>
            {Math.round(opportunity.confidence_score * 100)}%
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-foreground mb-1">
        {opportunity.title}
      </h4>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">
        {opportunity.description || 'No description available'}
      </p>

      {/* Supporting Evidence */}
      <SupportingEvidenceSection
        evidence={opportunity.supporting_evidence}
        className="border-t pt-3"
      />
    </div>
  );
}

/**
 * Skeleton loading state for the market gaps section.
 */
function MarketGapsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4"
      data-testid="market-gaps-skeleton"
    >
      {/* Three opportunity card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 rounded-lg border border-border"
        >
          <div className="flex justify-between mb-2">
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
          <div className="h-6 w-3/4 mb-2 bg-muted rounded" />
          <div className="h-[48px] w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no market gap opportunities exist.
 */
function MarketGapsEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="market-gaps-empty"
    >
      <p className="text-sm text-muted-foreground mb-2">
        No market gap opportunities identified
      </p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Generate AI opportunities in Market Intelligence to populate this section.
      </p>
    </div>
  );
}
