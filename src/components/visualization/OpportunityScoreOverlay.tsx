'use client';

/**
 * @fileoverview Opportunity Score Overlay for Competitor Positioning Chart
 *
 * Displays calculated opportunity scores in each quadrant to help prioritize
 * market entry decisions. Scores are based on:
 * - Competition density (fewer competitors = higher opportunity)
 * - Available market share (lower captured share = more room)
 * - Kel proximity (closer to target = more strategically relevant)
 *
 * @example
 * <OpportunityScoreOverlay
 *   competitors={competitors}
 *   kelPosition={kelPosition}
 *   isVisible={true}
 * />
 */

import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { CompetitorDataPoint } from '@/types';

type Quadrant = 'premium' | 'value' | 'budget' | 'niche';

interface QuadrantData {
  name: string;
  label: string;
  competitors: CompetitorDataPoint[];
  totalMarketShare: number;
  competitorCount: number;
}

interface OpportunityScore {
  quadrant: Quadrant;
  score: number;
  breakdown: {
    densityScore: number;
    marketShareScore: number;
    proximityScore: number;
  };
  recommendation: string;
}

interface OpportunityScoreOverlayProps {
  /** All competitor data points */
  competitors: CompetitorDataPoint[];
  /** Kel's target position (if set) */
  kelPosition: CompetitorDataPoint | null;
  /** Whether to show the overlay */
  isVisible?: boolean;
}

// Quadrant boundaries (using 5 as midpoint per existing chart logic)
const QUADRANT_BOUNDS = {
  premium: { xMin: 5, xMax: 10, yMin: 5, yMax: 10 },
  value: { xMin: 1, xMax: 5, yMin: 5, yMax: 10 },
  budget: { xMin: 1, xMax: 5, yMin: 1, yMax: 5 },
  niche: { xMin: 5, xMax: 10, yMin: 1, yMax: 5 }, // "Low Quality" quadrant renamed for scoring context
} as const;

// Quadrant center points for proximity calculation
const QUADRANT_CENTERS = {
  premium: { x: 7.5, y: 7.5 },
  value: { x: 3, y: 7.5 },
  budget: { x: 3, y: 3 },
  niche: { x: 7.5, y: 3 },
} as const;

// Score weights
const WEIGHTS = {
  density: 0.40,      // Competition density
  marketShare: 0.35,  // Available market share
  proximity: 0.25,    // Proximity to Kel position
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
 * Calculate Euclidean distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate opportunity scores for all quadrants
 */
function calculateOpportunityScores(
  competitors: CompetitorDataPoint[],
  kelPosition: CompetitorDataPoint | null
): OpportunityScore[] {
  // Filter out Kel position from competitor analysis
  const actualCompetitors = competitors.filter((c) => !c.is_kel_position);

  // Group competitors by quadrant
  const quadrantData: Record<Quadrant, QuadrantData> = {
    premium: { name: 'premium', label: 'Premium', competitors: [], totalMarketShare: 0, competitorCount: 0 },
    value: { name: 'value', label: 'Value', competitors: [], totalMarketShare: 0, competitorCount: 0 },
    budget: { name: 'budget', label: 'Budget', competitors: [], totalMarketShare: 0, competitorCount: 0 },
    niche: { name: 'niche', label: 'Niche', competitors: [], totalMarketShare: 0, competitorCount: 0 },
  };

  for (const competitor of actualCompetitors) {
    const quadrant = getQuadrant(competitor.price_score, competitor.quality_score);
    quadrantData[quadrant].competitors.push(competitor);
    quadrantData[quadrant].competitorCount++;
    quadrantData[quadrant].totalMarketShare += competitor.market_share_percent ?? 0;
  }

  // Calculate max values for normalization
  const maxCompetitors = Math.max(...Object.values(quadrantData).map((q) => q.competitorCount), 1);
  const maxMarketShare = Math.max(...Object.values(quadrantData).map((q) => q.totalMarketShare), 1);

  // Kel position for proximity calculation (default to center if not set)
  const kelX = kelPosition?.price_score ?? 5.5;
  const kelY = kelPosition?.quality_score ?? 5.5;

  // Max possible distance (corner to corner of chart)
  const maxDistance = distance(1, 1, 10, 10);

  // Calculate scores for each quadrant
  const scores: OpportunityScore[] = [];

  for (const [quadrant, data] of Object.entries(quadrantData) as [Quadrant, QuadrantData][]) {
    // Density score: fewer competitors = higher score (0-100)
    // 0 competitors = 100, maxCompetitors = 0
    const densityScore = Math.round((1 - data.competitorCount / maxCompetitors) * 100);

    // Market share score: lower captured share = higher opportunity (0-100)
    // Assumes 100% total possible, so available = 100 - captured
    // If no market share data, assume moderate capture (50%)
    const capturedShare = data.totalMarketShare > 0 ? data.totalMarketShare : (data.competitorCount * 10);
    const marketShareScore = Math.round(Math.max(0, Math.min(100, 100 - capturedShare)));

    // Proximity score: closer to Kel = higher score (0-100)
    const center = QUADRANT_CENTERS[quadrant];
    const distToKel = distance(center.x, center.y, kelX, kelY);
    const proximityScore = Math.round((1 - distToKel / maxDistance) * 100);

    // Weighted total score
    const totalScore = Math.round(
      densityScore * WEIGHTS.density +
      marketShareScore * WEIGHTS.marketShare +
      proximityScore * WEIGHTS.proximity
    );

    // Generate recommendation based on score
    let recommendation: string;
    if (totalScore >= 70) {
      recommendation = 'High opportunity - consider prioritizing';
    } else if (totalScore >= 50) {
      recommendation = 'Moderate opportunity - worth exploring';
    } else if (totalScore >= 30) {
      recommendation = 'Competitive - requires differentiation';
    } else {
      recommendation = 'Crowded market - low priority';
    }

    scores.push({
      quadrant,
      score: totalScore,
      breakdown: {
        densityScore,
        marketShareScore,
        proximityScore,
      },
      recommendation,
    });
  }

  return scores;
}

/**
 * Get color class based on score
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (score >= 30) return 'text-slate-600 bg-slate-50 border-slate-200';
  return 'text-slate-400 bg-slate-50/50 border-slate-100';
}

/**
 * Get position styles for each quadrant badge
 */
function getQuadrantPosition(quadrant: Quadrant): React.CSSProperties {
  switch (quadrant) {
    case 'premium':
      return { top: '8%', right: '8%' };
    case 'value':
      return { top: '8%', left: '8%' };
    case 'budget':
      return { bottom: '12%', left: '8%' };
    case 'niche':
      return { bottom: '12%', right: '8%' };
  }
}

/**
 * OpportunityScoreOverlay Component
 *
 * Displays opportunity scores in each quadrant corner to guide strategic decisions.
 * Hover over scores to see detailed breakdown.
 */
export function OpportunityScoreOverlay({
  competitors,
  kelPosition,
  isVisible = true,
}: OpportunityScoreOverlayProps) {
  const scores = useMemo(
    () => calculateOpportunityScores(competitors, kelPosition),
    [competitors, kelPosition]
  );

  if (!isVisible || competitors.length === 0) return null;

  return (
    <div
      data-testid="opportunity-score-overlay"
      className="absolute inset-0 pointer-events-none"
      aria-label="Opportunity scores by quadrant"
    >
      {scores.map((scoreData) => (
        <div
          key={scoreData.quadrant}
          className="absolute pointer-events-auto"
          style={getQuadrantPosition(scoreData.quadrant)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`
                  px-2 py-1 rounded-md border text-xs font-semibold
                  transition-all duration-200 hover:scale-105
                  ${getScoreColor(scoreData.score)}
                `}
                aria-label={`${scoreData.quadrant} quadrant opportunity score: ${scoreData.score}`}
              >
                {scoreData.score}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="w-56 p-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{scoreData.quadrant}</span>
                  <span className={`text-lg font-bold ${scoreData.score >= 70 ? 'text-green-600' : scoreData.score >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {scoreData.score}/100
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Competition (40%)</span>
                    <span className="font-medium">{scoreData.breakdown.densityScore}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Market Available (35%)</span>
                    <span className="font-medium">{scoreData.breakdown.marketShareScore}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Kel Proximity (25%)</span>
                    <span className="font-medium">{scoreData.breakdown.proximityScore}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-1 border-t">
                  {scoreData.recommendation}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
