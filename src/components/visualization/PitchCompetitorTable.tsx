'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { MetricTooltip } from './MetricTooltip';

import type { CompetitorDataPoint } from '@/types';

interface PitchCompetitorTableProps {
  competitors: CompetitorDataPoint[];
  kelPosition: CompetitorDataPoint | null;
}

/**
 * Convert a price score (1-10) to a human-readable price range label.
 * Used in the Pitch Mode competitor comparison table.
 *
 * @param score - Price score from 1-10
 * @returns "Budget" (1-3), "Mid-Range" (4-6), or "Premium" (7-10)
 */
export function getPriceRangeLabel(score: number): string {
  if (score <= 3) return 'Budget';
  if (score <= 6) return 'Mid-Range';
  return 'Premium';
}

/**
 * Determine market position quadrant based on price and quality scores.
 * Maps the 2D scatter chart position to a human-readable label.
 *
 * @param priceScore - Price score from 1-10
 * @param qualityScore - Quality score from 1-10
 * @returns Market position label: "Premium", "Value", "Budget", or "Low Quality"
 */
export function getMarketPosition(priceScore: number, qualityScore: number): string {
  const highPrice = priceScore > 5;
  const highQuality = qualityScore > 5;

  if (highPrice && highQuality) return 'Premium';
  if (!highPrice && highQuality) return 'Value';
  if (!highPrice && !highQuality) return 'Budget';
  return 'Low Quality';
}

/**
 * PitchCompetitorTable - A clean, read-only comparison table for Pitch Mode.
 *
 * Displays competitors in a professional table format without any edit controls.
 * Highlights Kel's position with a distinct background color.
 *
 * @example
 * ```tsx
 * <PitchCompetitorTable
 *   competitors={competitorData}
 *   kelPosition={kelData}
 * />
 * ```
 */
export function PitchCompetitorTable({
  competitors,
  kelPosition,
}: PitchCompetitorTableProps) {
  // Combine competitors with Kel position, Kel first if present
  // Filter out any duplicate Kel entries from competitors array
  const competitorsWithoutKel = competitors.filter((c) => !c.is_kel_position);
  const tableData = kelPosition
    ? [kelPosition, ...competitorsWithoutKel]
    : competitorsWithoutKel;

  // Don't render empty table
  if (tableData.length === 0) {
    return null;
  }

  return (
    <div data-testid="pitch-competitor-table" className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>
              <MetricTooltip metricKey="priceRange">Price Range</MetricTooltip>
            </TableHead>
            <TableHead>
              <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
            </TableHead>
            <TableHead>
              <MetricTooltip metricKey="marketPosition">Market Position</MetricTooltip>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((item) => (
            <TableRow
              key={item.id}
              data-testid={item.is_kel_position ? 'pitch-kel-row-highlight' : undefined}
              className={cn(item.is_kel_position && 'bg-primary/10')}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{getPriceRangeLabel(item.price_score)}</TableCell>
              <TableCell>{item.quality_score}/10</TableCell>
              <TableCell>{getMarketPosition(item.price_score, item.quality_score)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
