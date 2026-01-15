'use client';

/**
 * CompetitiveLandscapeSection Component
 *
 * Displays an interactive scatter chart showing competitive positioning
 * within a pitch section. Uses the existing ScatterChart with isPitchMode={true}
 * for read-only display with Kel position highlight.
 *
 * Story 18-2: Dynamic Data Integration in Pitch
 *
 * @example
 * ```tsx
 * <CompetitiveLandscapeSection onRefresh={() => refetch()} />
 * ```
 */

import { RefreshCw } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScatterChart } from '@/components/visualization/ScatterChart';
import { useCompetitorData } from '@/hooks/competitors';
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_DESCRIPTIONS,
} from '@/types/pitch';

interface CompetitiveLandscapeSectionProps {
  /** Optional callback when data is refreshed */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pitch section displaying the competitive landscape scatter chart.
 * Uses live data via useCompetitorData hook.
 */
export function CompetitiveLandscapeSection({
  onRefresh,
  className,
}: CompetitiveLandscapeSectionProps) {
  const {
    data: competitors,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useCompetitorData();

  const label = SECTION_TYPE_LABELS.competitive_landscape;
  const description = SECTION_TYPE_DESCRIPTIONS.competitive_landscape;

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // No-op handlers for pitch mode (read-only)
  const noopEdit = useCallback(() => {}, []);
  const noopDelete = useCallback(() => {}, []);

  return (
    <Card className={className} data-testid="pitch-section-competitive_landscape">
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
            data-testid="refresh-competitive-landscape"
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
          <CompetitiveLandscapeSkeleton />
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            data-testid="competitive-landscape-error"
          >
            <p className="text-sm text-destructive mb-2">
              Failed to load competitor data
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
        ) : !competitors || competitors.length === 0 ? (
          <CompetitiveLandscapeEmptyState />
        ) : (
          <div data-testid="competitive-landscape-chart">
            <ScatterChart
              isMaho={false}
              isPitchMode={true}
              onEditClick={noopEdit}
              onDeleteClick={noopDelete}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for the competitive landscape section.
 * Shows placeholder for the chart area.
 */
function CompetitiveLandscapeSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4"
      data-testid="competitive-landscape-skeleton"
    >
      {/* Chart skeleton - matches ScatterChart height */}
      <div className="h-[300px] w-full bg-muted rounded-lg" />
      {/* Legend skeleton */}
      <div className="flex gap-4">
        <div className="h-[48px] w-24 bg-muted rounded" />
        <div className="h-[48px] w-24 bg-muted rounded" />
      </div>
    </div>
  );
}

/**
 * Empty state when no competitor data exists.
 */
function CompetitiveLandscapeEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="competitive-landscape-empty"
    >
      <p className="text-sm text-muted-foreground mb-2">
        No competitor data available
      </p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Add competitor positioning data in Market Intelligence to see the
        competitive landscape chart.
      </p>
    </div>
  );
}
