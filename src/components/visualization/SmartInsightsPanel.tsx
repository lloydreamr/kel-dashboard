'use client';

/**
 * @fileoverview Smart Insights Panel - Auto-generated Strategic Intelligence
 *
 * Surfaces actionable insights by analyzing the competitor landscape:
 * - Gap detection: Identifies underserved quadrant/distribution combinations
 * - Threat proximity: Counts competitors clustering near Kel position
 * - Market concentration: Warns when market is highly concentrated
 *
 * Insights are generated dynamically from competitor data and prioritized by actionability.
 *
 * @example
 * <SmartInsightsPanel
 *   competitors={competitors}
 *   kelPosition={kelPosition}
 *   maxInsights={4}
 * />
 */

import { useMemo } from 'react';
import { AlertTriangle, Lightbulb, Target, TrendingUp, Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { calculateDistanceToKel } from '@/lib/utils/positioning';

import type { CompetitorDataPoint } from '@/types';

type InsightType = 'gap' | 'threat' | 'concentration' | 'opportunity';
type InsightPriority = 'high' | 'medium' | 'low';

interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  detail?: string;
}

interface SmartInsightsPanelProps {
  /** All competitor data points */
  competitors: CompetitorDataPoint[];
  /** Kel's target position (if set) */
  kelPosition: CompetitorDataPoint | null;
  /** Maximum number of insights to display */
  maxInsights?: number;
  /** Whether to show the panel */
  isVisible?: boolean;
}

// Quadrant definitions
type Quadrant = 'premium' | 'value' | 'budget' | 'niche';

const QUADRANT_BOUNDS = {
  premium: { xMin: 5, xMax: 10, yMin: 5, yMax: 10, label: 'Premium' },
  value: { xMin: 1, xMax: 5, yMin: 5, yMax: 10, label: 'Value' },
  budget: { xMin: 1, xMax: 5, yMin: 1, yMax: 5, label: 'Budget' },
  niche: { xMin: 5, xMax: 10, yMin: 1, yMax: 5, label: 'Niche' },
} as const;

// Distribution reach thresholds for gap analysis
const DISTRIBUTION_THRESHOLDS = {
  high: 60,  // >60% = high distribution
  medium: 30, // 30-60% = medium distribution
  low: 30,    // <30% = low distribution
} as const;

// Threat proximity thresholds
const PROXIMITY_THRESHOLDS = {
  critical: 1.0,  // Within 1.0 units
  warning: 2.0,   // Within 2.0 units
} as const;

// HHI thresholds (industry standard)
const HHI_THRESHOLDS = {
  competitive: 1500,     // HHI < 1500 = competitive
  moderate: 2500,        // 1500-2500 = moderately concentrated
  concentrated: 2500,    // > 2500 = highly concentrated
} as const;

/**
 * Determine which quadrant a competitor falls into
 */
function getQuadrant(priceScore: number, qualityScore: number): Quadrant {
  if (priceScore > 5 && qualityScore > 5) return 'premium';
  if (priceScore <= 5 && qualityScore > 5) return 'value';
  if (priceScore <= 5 && qualityScore <= 5) return 'budget';
  return 'niche';
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI)
 * Sum of squared market shares (each as percentage 0-100)
 * Range: 0 (perfect competition) to 10000 (monopoly)
 */
function calculateHHI(competitors: CompetitorDataPoint[]): number | null {
  const withMarketShare = competitors.filter(
    (c) => !c.is_kel_position && c.market_share_percent != null
  );

  if (withMarketShare.length < 2) return null; // Need at least 2 players for HHI

  return withMarketShare.reduce(
    (sum, c) => sum + Math.pow(c.market_share_percent ?? 0, 2),
    0
  );
}

/**
 * Generate insights from competitor data
 */
function generateInsights(
  competitors: CompetitorDataPoint[],
  kelPosition: CompetitorDataPoint | null
): Insight[] {
  const insights: Insight[] = [];
  const actualCompetitors = competitors.filter((c) => !c.is_kel_position);

  if (actualCompetitors.length === 0) return insights;

  // Group competitors by quadrant
  const byQuadrant: Record<Quadrant, CompetitorDataPoint[]> = {
    premium: [],
    value: [],
    budget: [],
    niche: [],
  };

  for (const c of actualCompetitors) {
    const quadrant = getQuadrant(c.price_score, c.quality_score);
    byQuadrant[quadrant].push(c);
  }

  // === GAP DETECTION ===
  // Check for quadrants with no high-distribution competitors
  for (const [quadrant, comps] of Object.entries(byQuadrant) as [Quadrant, CompetitorDataPoint[]][]) {
    const highDistribution = comps.filter(
      (c) => c.distribution_reach_percent != null && c.distribution_reach_percent >= DISTRIBUTION_THRESHOLDS.high
    );

    if (comps.length > 0 && highDistribution.length === 0) {
      // Quadrant has competitors but none with high distribution
      insights.push({
        id: `gap-dist-${quadrant}`,
        type: 'gap',
        priority: 'medium',
        title: `Distribution gap in ${QUADRANT_BOUNDS[quadrant].label}`,
        description: `${comps.length} competitors but none with >60% distribution reach`,
        detail: `The ${QUADRANT_BOUNDS[quadrant].label.toLowerCase()} segment has competitors but lacks dominant distribution players. A well-distributed entry could capture significant share.`,
      });
    }

    if (comps.length === 0) {
      // Empty quadrant
      insights.push({
        id: `gap-empty-${quadrant}`,
        type: 'gap',
        priority: 'high',
        title: `Empty ${QUADRANT_BOUNDS[quadrant].label} quadrant`,
        description: 'No competitors in this market segment',
        detail: `The ${QUADRANT_BOUNDS[quadrant].label.toLowerCase()} quadrant is completely unserved. This could indicate an untapped opportunity or a segment with insufficient demand.`,
      });
    }
  }

  // === THREAT PROXIMITY ===
  if (kelPosition) {
    // Count competitors at each threat level
    const criticalThreats: CompetitorDataPoint[] = [];
    const warningThreats: CompetitorDataPoint[] = [];

    for (const c of actualCompetitors) {
      const distance = calculateDistanceToKel(c, kelPosition);
      if (distance !== null) {
        if (distance <= PROXIMITY_THRESHOLDS.critical) {
          criticalThreats.push(c);
        } else if (distance <= PROXIMITY_THRESHOLDS.warning) {
          warningThreats.push(c);
        }
      }
    }

    if (criticalThreats.length > 0) {
      insights.push({
        id: 'threat-critical',
        type: 'threat',
        priority: 'high',
        title: `${criticalThreats.length} direct competitor${criticalThreats.length > 1 ? 's' : ''}`,
        description: `Within 1.0 units of Kel's position`,
        detail: `Critical proximity: ${criticalThreats.map((c) => c.name).join(', ')}. These competitors occupy nearly identical market positioning and will be primary competitors.`,
      });
    }

    if (warningThreats.length > 0) {
      insights.push({
        id: 'threat-warning',
        type: 'threat',
        priority: 'medium',
        title: `${warningThreats.length} nearby competitor${warningThreats.length > 1 ? 's' : ''}`,
        description: `Within 2.0 units of Kel's position`,
        detail: `Close proximity: ${warningThreats.map((c) => c.name).join(', ')}. These competitors target adjacent market positions and could easily pivot to compete directly.`,
      });
    }

    // Check if Kel is in a crowded quadrant
    const kelQuadrant = getQuadrant(kelPosition.price_score, kelPosition.quality_score);
    const kelQuadrantCount = byQuadrant[kelQuadrant].length;
    if (kelQuadrantCount >= 5) {
      insights.push({
        id: 'quadrant-crowded',
        type: 'threat',
        priority: 'medium',
        title: `Crowded ${QUADRANT_BOUNDS[kelQuadrant].label} quadrant`,
        description: `${kelQuadrantCount} competitors in Kel's target quadrant`,
        detail: `The ${QUADRANT_BOUNDS[kelQuadrant].label.toLowerCase()} quadrant is densely populated. Differentiation will be critical for market entry success.`,
      });
    }
  }

  // === MARKET CONCENTRATION (HHI) ===
  const hhi = calculateHHI(competitors);
  if (hhi !== null) {
    if (hhi >= HHI_THRESHOLDS.concentrated) {
      // Find the dominant players
      const sortedByShare = [...actualCompetitors]
        .filter((c) => c.market_share_percent != null)
        .sort((a, b) => (b.market_share_percent ?? 0) - (a.market_share_percent ?? 0));
      const top3 = sortedByShare.slice(0, 3);

      insights.push({
        id: 'hhi-concentrated',
        type: 'concentration',
        priority: 'high',
        title: 'Highly concentrated market',
        description: `HHI: ${Math.round(hhi)} — dominated by few players`,
        detail: `Market concentration is high. Top players: ${top3.map((c) => `${c.name} (${c.market_share_percent}%)`).join(', ')}. Entry may require targeting underserved niches.`,
      });
    } else if (hhi >= HHI_THRESHOLDS.competitive && hhi < HHI_THRESHOLDS.moderate) {
      insights.push({
        id: 'hhi-moderate',
        type: 'concentration',
        priority: 'low',
        title: 'Moderately competitive market',
        description: `HHI: ${Math.round(hhi)} — balanced competition`,
        detail: 'Market shows moderate concentration with room for new entrants. Focus on clear differentiation to carve out market share.',
      });
    }
  }

  // === OPPORTUNITY DETECTION ===
  // Check for quadrants with weak (low market share) competitors
  for (const [quadrant, comps] of Object.entries(byQuadrant) as [Quadrant, CompetitorDataPoint[]][]) {
    const withShare = comps.filter((c) => c.market_share_percent != null);
    if (withShare.length > 0) {
      const totalShare = withShare.reduce((sum, c) => sum + (c.market_share_percent ?? 0), 0);
      const avgShare = totalShare / withShare.length;

      if (avgShare < 5 && comps.length >= 2) {
        insights.push({
          id: `opp-weak-${quadrant}`,
          type: 'opportunity',
          priority: 'medium',
          title: `Weak competition in ${QUADRANT_BOUNDS[quadrant].label}`,
          description: `${comps.length} competitors averaging only ${avgShare.toFixed(1)}% share`,
          detail: `The ${QUADRANT_BOUNDS[quadrant].label.toLowerCase()} segment has multiple small players without a clear leader. This fragmentation creates opportunity for a well-positioned entry.`,
        });
      }
    }
  }

  // Sort by priority (high first) then by type
  const priorityOrder: Record<InsightPriority, number> = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get icon for insight type
 */
function getInsightIcon(type: InsightType): React.ReactNode {
  switch (type) {
    case 'gap':
      return <Lightbulb className="h-3.5 w-3.5" />;
    case 'threat':
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case 'concentration':
      return <Users className="h-3.5 w-3.5" />;
    case 'opportunity':
      return <Target className="h-3.5 w-3.5" />;
  }
}

/**
 * Get color classes for insight priority
 */
function getPriorityColor(priority: InsightPriority): string {
  switch (priority) {
    case 'high':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'medium':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'low':
      return 'bg-slate-50 border-slate-200 text-slate-600';
  }
}

/**
 * SmartInsightsPanel Component
 *
 * Displays auto-generated insights about the competitive landscape.
 * Insights are prioritized by actionability and relevance to Kel's position.
 */
export function SmartInsightsPanel({
  competitors,
  kelPosition,
  maxInsights = 4,
  isVisible = true,
}: SmartInsightsPanelProps) {
  const insights = useMemo(
    () => generateInsights(competitors, kelPosition).slice(0, maxInsights),
    [competitors, kelPosition, maxInsights]
  );

  if (!isVisible || insights.length === 0) return null;

  return (
    <div
      data-testid="smart-insights-panel"
      className="bg-card rounded-lg border p-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Smart Insights</h3>
        <span className="text-xs text-muted-foreground">
          ({insights.length} insight{insights.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Insight Cards */}
      <div className="space-y-2">
        {insights.map((insight) => (
          <Tooltip key={insight.id}>
            <TooltipTrigger asChild>
              <div
                data-testid={`insight-card-${insight.type}`}
                className={`flex items-start gap-2 p-2 rounded border cursor-help transition-colors hover:brightness-95 ${getPriorityColor(insight.priority)}`}
              >
                <div className="mt-0.5 shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-tight">{insight.title}</p>
                  <p className="text-[10px] opacity-80 leading-tight mt-0.5">
                    {insight.description}
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            {insight.detail && (
              <TooltipContent side="right" className="max-w-[280px] p-3">
                <p className="text-xs">{insight.detail}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

// Export HHI calculation for use in ChartStatsBar
export { calculateHHI };
