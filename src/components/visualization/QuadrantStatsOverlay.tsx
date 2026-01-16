'use client';

/**
 * @fileoverview Quadrant statistics overlay for scatter chart
 *
 * Displays aggregate statistics for each quadrant:
 * - Competitor count
 * - Total market share
 * - Average market share (when data available)
 *
 * Positioned in chart corners without obscuring data points.
 * Responsive: hidden on small mobile to prevent overlap.
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { CompetitorDataPoint } from '@/types';

type Quadrant = 'premium' | 'value' | 'budget' | 'low-quality';

interface QuadrantStats {
  count: number;
  totalMarketShare: number;
  avgMarketShare: number | null;
  hasMarketData: boolean;
}

interface QuadrantStatsOverlayProps {
  /** All competitor data points */
  competitors: CompetitorDataPoint[];
  /** Whether to show the overlay (hidden on very small screens) */
  isVisible: boolean;
}

/**
 * Classify a competitor into a quadrant based on price/quality scores
 * Using 5.0 as boundary (same as ScatterChart)
 */
function getQuadrant(priceScore: number, qualityScore: number): Quadrant {
  if (priceScore > 5 && qualityScore > 5) return 'premium';
  if (priceScore <= 5 && qualityScore > 5) return 'value';
  if (priceScore <= 5 && qualityScore <= 5) return 'budget';
  return 'low-quality';
}

/**
 * Calculate aggregate statistics for a quadrant
 */
function calculateQuadrantStats(competitors: CompetitorDataPoint[], quadrant: Quadrant): QuadrantStats {
  const quadrantCompetitors = competitors.filter(
    (c) => getQuadrant(c.price_score, c.quality_score) === quadrant
  );

  const count = quadrantCompetitors.length;
  const competitorsWithMarketShare = quadrantCompetitors.filter(
    (c) => c.market_share_percent !== null && c.market_share_percent !== undefined
  );

  const totalMarketShare = competitorsWithMarketShare.reduce(
    (sum, c) => sum + (c.market_share_percent ?? 0),
    0
  );

  const avgMarketShare = competitorsWithMarketShare.length > 0
    ? totalMarketShare / competitorsWithMarketShare.length
    : null;

  return {
    count,
    totalMarketShare,
    avgMarketShare,
    hasMarketData: competitorsWithMarketShare.length > 0,
  };
}

/**
 * Quadrant display configuration
 */
const QUADRANT_CONFIG: Record<Quadrant, {
  label: string;
  description: string;
  position: string; // Tailwind positioning classes
}> = {
  premium: {
    label: 'Premium',
    description: 'High price, high quality',
    position: 'top-2 right-2',
  },
  value: {
    label: 'Value',
    description: 'Low price, high quality',
    position: 'top-2 left-2',
  },
  budget: {
    label: 'Budget',
    description: 'Low price, low quality',
    position: 'bottom-12 left-2', // Extra bottom offset for axis label
  },
  'low-quality': {
    label: 'Low Quality',
    description: 'High price, low quality',
    position: 'bottom-12 right-2', // Extra bottom offset for axis label
  },
};

/**
 * Single quadrant stat card
 */
function QuadrantStatCard({
  quadrant,
  stats,
}: {
  quadrant: Quadrant;
  stats: QuadrantStats;
}) {
  const config = QUADRANT_CONFIG[quadrant];
  const isGap = stats.count <= 1;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          data-testid={`quadrant-stats-${quadrant}`}
          className={`
            absolute ${config.position}
            bg-background/80 backdrop-blur-sm
            border rounded-md px-2 py-1
            text-xs transition-all duration-200
            hover:bg-background hover:shadow-sm
            cursor-default select-none
            ${isGap ? 'border-dashed border-muted-foreground/40' : 'border-border'}
          `}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/80">{stats.count}</span>
            {stats.hasMarketData && stats.totalMarketShare > 0 && (
              <Badge
                variant="secondary"
                className="h-4 px-1 text-[10px] font-normal"
              >
                {stats.totalMarketShare.toFixed(0)}%
              </Badge>
            )}
            {isGap && (
              <span className="text-[10px] text-muted-foreground italic">gap</span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <div className="space-y-1">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          <div className="pt-1 border-t space-y-0.5 text-xs">
            <p>Competitors: <span className="font-medium">{stats.count}</span></p>
            {stats.hasMarketData && (
              <>
                <p>Total share: <span className="font-medium">{stats.totalMarketShare.toFixed(1)}%</span></p>
                {stats.avgMarketShare !== null && (
                  <p>Avg share: <span className="font-medium">{stats.avgMarketShare.toFixed(1)}%</span></p>
                )}
              </>
            )}
            {isGap && (
              <p className="text-amber-600 pt-1">Potential opportunity area</p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function QuadrantStatsOverlay({ competitors, isVisible }: QuadrantStatsOverlayProps) {
  if (!isVisible || competitors.length === 0) {
    return null;
  }

  const quadrants: Quadrant[] = ['premium', 'value', 'budget', 'low-quality'];
  const stats = Object.fromEntries(
    quadrants.map((q) => [q, calculateQuadrantStats(competitors, q)])
  ) as Record<Quadrant, QuadrantStats>;

  return (
    <div
      data-testid="quadrant-stats-overlay"
      className="absolute inset-0 pointer-events-none"
    >
      {quadrants.map((quadrant) => (
        <div key={quadrant} className="pointer-events-auto">
          <QuadrantStatCard quadrant={quadrant} stats={stats[quadrant]} />
        </div>
      ))}
    </div>
  );
}
