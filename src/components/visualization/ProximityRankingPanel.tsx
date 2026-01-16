'use client';

/**
 * @fileoverview Proximity Ranking Panel for Competitor Analysis
 *
 * Displays competitors ranked by their distance to Kel's target position,
 * helping identify direct competitors and strategic priorities.
 *
 * Features:
 * - Ranked list of closest competitors
 * - Color-coded threat level badges
 * - Distance metrics
 * - Collapsible for minimal footprint
 *
 * @example
 * <ProximityRankingPanel
 *   competitors={competitors}
 *   kelPosition={kelPosition}
 *   onCompetitorClick={handleClick}
 * />
 */

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';

import {
  rankByProximity,
  getThreatColorClass,
  formatDistance,
} from '@/lib/utils/positioning';

import type { CompetitorDataPoint } from '@/types';

interface ProximityRankingPanelProps {
  /** All competitor data points */
  competitors: CompetitorDataPoint[];
  /** Kel's target position (required to show rankings) */
  kelPosition: CompetitorDataPoint | null;
  /** Callback when a competitor is clicked */
  onCompetitorClick?: (competitor: CompetitorDataPoint) => void;
  /** Maximum number of competitors to show (default: 5) */
  maxDisplay?: number;
  /** Whether the panel starts expanded (default: true) */
  defaultExpanded?: boolean;
}

/**
 * Get emoji for threat level
 */
function getThreatEmoji(level: string): string {
  switch (level) {
    case 'critical':
      return '🎯';
    case 'high':
      return '⚠️';
    case 'moderate':
      return '👀';
    case 'low':
      return '✓';
    default:
      return '';
  }
}

/**
 * ProximityRankingPanel Component
 *
 * Shows competitors ranked by distance to Kel's position with threat indicators.
 */
export function ProximityRankingPanel({
  competitors,
  kelPosition,
  onCompetitorClick,
  maxDisplay = 5,
  defaultExpanded = true,
}: ProximityRankingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get ranked competitors
  const rankedCompetitors = rankByProximity(competitors, kelPosition);
  const displayedCompetitors = rankedCompetitors.slice(0, maxDisplay);
  const hasMore = rankedCompetitors.length > maxDisplay;

  // Don't render if no Kel position or no competitors
  if (!kelPosition || displayedCompetitors.length === 0) {
    return null;
  }

  // Count by threat level for summary
  const threatCounts = rankedCompetitors.reduce(
    (acc, rc) => {
      acc[rc.threatLevel] = (acc[rc.threatLevel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div
      data-testid="proximity-ranking-panel"
      className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm overflow-hidden"
    >
      {/* Header / Toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
        aria-label={isExpanded ? 'Collapse proximity rankings' : 'Expand proximity rankings'}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Proximity Ranking</span>
          {/* Threat level summary badges */}
          <div className="flex gap-1">
            {threatCounts.critical && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                {threatCounts.critical} critical
              </span>
            )}
            {threatCounts.high && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                {threatCounts.high} high
              </span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {displayedCompetitors.map((rc) => (
            <button
              key={rc.competitor.id}
              onClick={() => onCompetitorClick?.(rc.competitor)}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
              data-testid={`proximity-rank-${rc.rank}`}
            >
              {/* Rank number */}
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                {rc.rank}
              </span>

              {/* Competitor name */}
              <span className="flex-1 text-sm truncate">{rc.competitor.name}</span>

              {/* Threat badge */}
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0.5 ${getThreatColorClass(rc.threatLevel)}`}
              >
                {getThreatEmoji(rc.threatLevel)} {rc.threatLevel}
              </Badge>

              {/* Distance */}
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDistance(rc.distance)}
              </span>
            </button>
          ))}

          {/* Show more indicator */}
          {hasMore && (
            <p className="text-xs text-center text-muted-foreground pt-1">
              +{rankedCompetitors.length - maxDisplay} more competitors
            </p>
          )}
        </div>
      )}
    </div>
  );
}
