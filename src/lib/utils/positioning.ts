/**
 * @fileoverview Positioning utilities for competitor analysis
 *
 * Provides distance calculations and threat level assessments
 * for competitive positioning on the price/quality matrix.
 *
 * @example
 * const distance = calculateDistanceToKel(competitor, kelPosition);
 * const threat = getThreatLevel(distance);
 * const ranked = rankByProximity(competitors, kelPosition);
 */

import type { CompetitorDataPoint } from '@/types';

/**
 * Threat level based on distance to Kel's position
 * Closer competitors = higher threat
 */
export type ThreatLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface ThreatAssessment {
  distance: number;
  level: ThreatLevel;
  label: string;
  description: string;
}

export interface RankedCompetitor {
  competitor: CompetitorDataPoint;
  distance: number;
  rank: number;
  threatLevel: ThreatLevel;
}

// Distance thresholds for threat levels (on 1-10 scale)
// Max possible distance is ~12.73 (diagonal corner to corner)
const THREAT_THRESHOLDS = {
  CRITICAL: 1.5,  // Very close - direct competition
  HIGH: 3.0,      // Close enough to compete for same customers
  MODERATE: 5.0,  // Same general market space
  // > 5.0 = Low threat - different market positioning
} as const;

/**
 * Calculate Euclidean distance between two points on the chart
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate distance from a competitor to Kel's target position
 * Returns null if Kel position is not set
 */
export function calculateDistanceToKel(
  competitor: CompetitorDataPoint,
  kelPosition: CompetitorDataPoint | null
): number | null {
  if (!kelPosition) return null;

  return calculateDistance(
    competitor.price_score,
    competitor.quality_score,
    kelPosition.price_score,
    kelPosition.quality_score
  );
}

/**
 * Get threat level based on distance
 */
export function getThreatLevel(distance: number): ThreatLevel {
  if (distance <= THREAT_THRESHOLDS.CRITICAL) return 'critical';
  if (distance <= THREAT_THRESHOLDS.HIGH) return 'high';
  if (distance <= THREAT_THRESHOLDS.MODERATE) return 'moderate';
  return 'low';
}

/**
 * Get full threat assessment with labels and descriptions
 */
export function getThreatAssessment(distance: number | null): ThreatAssessment | null {
  if (distance === null) return null;

  const level = getThreatLevel(distance);

  const assessments: Record<ThreatLevel, Omit<ThreatAssessment, 'distance' | 'level'>> = {
    critical: {
      label: 'Critical',
      description: 'Direct competitor - very similar positioning',
    },
    high: {
      label: 'High',
      description: 'Close competitor - likely competing for same customers',
    },
    moderate: {
      label: 'Moderate',
      description: 'Same market space - indirect competition',
    },
    low: {
      label: 'Low',
      description: 'Different positioning - minimal overlap',
    },
  };

  return {
    distance,
    level,
    ...assessments[level],
  };
}

/**
 * Get color class for threat level badge
 */
export function getThreatColorClass(level: ThreatLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'moderate':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

/**
 * Rank competitors by proximity to Kel's position
 * Returns competitors sorted by distance (closest first)
 */
export function rankByProximity(
  competitors: CompetitorDataPoint[],
  kelPosition: CompetitorDataPoint | null
): RankedCompetitor[] {
  if (!kelPosition) return [];

  // Filter out Kel position itself
  const actualCompetitors = competitors.filter((c) => !c.is_kel_position);

  // Calculate distances and sort
  const withDistances = actualCompetitors.map((competitor) => ({
    competitor,
    distance: calculateDistanceToKel(competitor, kelPosition)!,
  }));

  // Sort by distance (closest first)
  withDistances.sort((a, b) => a.distance - b.distance);

  // Add ranks and threat levels
  return withDistances.map((item, index) => ({
    ...item,
    rank: index + 1,
    threatLevel: getThreatLevel(item.distance),
  }));
}

/**
 * Get the proximity rank of a specific competitor
 * Returns null if competitor not found or Kel position not set
 */
export function getProximityRank(
  competitorId: string,
  competitors: CompetitorDataPoint[],
  kelPosition: CompetitorDataPoint | null
): number | null {
  if (!kelPosition) return null;

  const ranked = rankByProximity(competitors, kelPosition);
  const found = ranked.find((r) => r.competitor.id === competitorId);

  return found?.rank ?? null;
}

/**
 * Format distance for display (rounded to 1 decimal)
 */
export function formatDistance(distance: number): string {
  return distance.toFixed(1);
}
