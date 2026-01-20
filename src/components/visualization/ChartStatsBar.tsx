'use client';

/**
 * @fileoverview Quick stats bar for scatter chart visualization
 *
 * Displays summary statistics above the chart for at-a-glance insights.
 * Shows competitor count, total market share tracked, HHI concentration, and positioning averages.
 *
 * HHI (Herfindahl-Hirschman Index) thresholds:
 * - < 1500: Competitive market
 * - 1500-2500: Moderately concentrated
 * - > 2500: Highly concentrated (potential antitrust concern)
 */

import { Users, PieChart, TrendingUp, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CompetitorDataPoint } from '@/types';

// HHI thresholds (industry standard from DOJ/FTC guidelines)
const HHI_THRESHOLDS = {
  competitive: 1500,
  moderate: 2500,
} as const;

interface ChartStatsBarProps {
  competitors: CompetitorDataPoint[];
  /** Hide in certain modes (e.g., pitch mode has its own stats) */
  isHidden?: boolean;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  /** Optional tooltip for explanation */
  tooltip?: string;
  /** Optional color class for the value */
  valueColor?: string;
}

function StatItem({ icon, label, value, subtext, tooltip, valueColor }: StatItemProps) {
  const content = (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium ${valueColor ?? ''}`}>
          {value}
          {subtext && <span className="text-xs text-muted-foreground ml-2">{subtext}</span>}
        </span>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-left cursor-help">
            {content}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI)
 * Sum of squared market shares (as percentages)
 * Range: 0 (perfect competition) to 10000 (monopoly)
 */
function calculateHHI(competitors: CompetitorDataPoint[]): number | null {
  const withMarketShare = competitors.filter(
    (c) => !c.is_kel_position && c.market_share_percent != null
  );

  if (withMarketShare.length < 2) return null;

  return withMarketShare.reduce(
    (sum, c) => sum + Math.pow(c.market_share_percent ?? 0, 2),
    0
  );
}

/**
 * Get HHI classification and color
 */
function getHHIClassification(hhi: number): { label: string; color: string; description: string } {
  if (hhi < HHI_THRESHOLDS.competitive) {
    return {
      label: 'Competitive',
      color: 'text-green-600',
      description: 'Low concentration market with many players — favorable for new entrants',
    };
  }
  if (hhi < HHI_THRESHOLDS.moderate) {
    return {
      label: 'Moderate',
      color: 'text-amber-600',
      description: 'Moderately concentrated — requires clear differentiation for entry',
    };
  }
  return {
    label: 'Concentrated',
    color: 'text-red-600',
    description: 'Highly concentrated market dominated by few players — difficult entry',
  };
}

/**
 * ChartStatsBar Component
 *
 * Shows summary statistics for the competitor landscape:
 * - Total competitor count (excluding Kel position)
 * - Total market share being tracked
 * - HHI (market concentration index)
 * - Average quality score of competitors
 */
export function ChartStatsBar({ competitors, isHidden = false }: ChartStatsBarProps) {
  if (isHidden) return null;

  // Filter out Kel position for competitor stats
  const competitorList = competitors.filter((c) => !c.is_kel_position);

  if (competitorList.length === 0) return null;

  // Calculate stats
  const totalCompetitors = competitorList.length;

  // Total market share (sum of all known market shares)
  const marketShareData = competitorList.filter((c) => c.market_share_percent != null);
  const totalMarketShare = marketShareData.reduce(
    (sum, c) => sum + (c.market_share_percent ?? 0),
    0
  );
  const hasMarketData = marketShareData.length > 0;

  // Calculate HHI (Herfindahl-Hirschman Index)
  const hhi = calculateHHI(competitors);
  const hhiClass = hhi !== null ? getHHIClassification(hhi) : null;

  // Average quality score
  const avgQuality = competitorList.reduce((sum, c) => sum + c.quality_score, 0) / totalCompetitors;

  // Count competitors with data enrichment (have at least one enriched field)
  const enrichedCount = competitorList.filter(
    (c) =>
      c.market_share_percent != null ||
      c.primary_channels?.length ||
      c.strengths?.length ||
      c.weaknesses?.length
  ).length;

  return (
    <div
      data-testid="chart-stats-bar"
      className="flex flex-wrap items-center gap-6 pb-4 mb-4 border-b border-border"
    >
      <StatItem
        icon={<Users className="h-4 w-4" />}
        label="Competitors"
        value={totalCompetitors}
        subtext={enrichedCount < totalCompetitors ? `(${enrichedCount} with data)` : undefined}
      />

      {hasMarketData && (
        <StatItem
          icon={<PieChart className="h-4 w-4" />}
          label="Market Tracked"
          value={`${totalMarketShare.toFixed(0)}%`}
          subtext={`(${marketShareData.length} of ${totalCompetitors})`}
        />
      )}

      {hhi !== null && hhiClass && (
        <StatItem
          icon={<Activity className="h-4 w-4" />}
          label="Concentration"
          value={hhiClass.label}
          subtext={`HHI: ${Math.round(hhi)}`}
          valueColor={hhiClass.color}
          tooltip={hhiClass.description}
        />
      )}

      <StatItem
        icon={<TrendingUp className="h-4 w-4" />}
        label="Avg Quality"
        value={avgQuality.toFixed(1)}
        subtext="/ 10"
      />
    </div>
  );
}
