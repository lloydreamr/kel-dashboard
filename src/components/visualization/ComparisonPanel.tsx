'use client';

/**
 * @fileoverview Side-by-side competitor comparison panel
 *
 * Displays selected competitors in a comparison table format.
 * Useful for pitch meetings to show how Kel positions against specific competitors.
 */

import { X, Star, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CompetitorDataPoint } from '@/types';

interface ComparisonPanelProps {
  /** Selected competitors to compare (max 4 recommended) */
  competitors: CompetitorDataPoint[];
  /** Kel target position (shown in first column if exists) */
  kelPosition: CompetitorDataPoint | null;
  /** Callback to remove a competitor from comparison */
  onRemove: (id: string) => void;
  /** Callback to clear all selections */
  onClearAll: () => void;
}

// Format price range for display
function formatPriceRange(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `₱${min} - ₱${max}`;
  if (min != null) return `₱${min}+`;
  return `Up to ₱${max}`;
}

// Format channels list
function formatChannels(channels: string[] | null | undefined): string {
  if (!channels || channels.length === 0) return '—';
  return channels.slice(0, 3).join(', ') + (channels.length > 3 ? '...' : '');
}

interface MetricRowProps {
  label: string;
  values: (string | number | null)[];
  highlight?: 'highest' | 'lowest' | null;
}

function MetricRow({ label, values }: MetricRowProps) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 text-xs text-muted-foreground font-medium whitespace-nowrap">
        {label}
      </td>
      {values.map((value, i) => (
        <td key={i} className="py-2 px-3 text-sm text-center">
          {value ?? '—'}
        </td>
      ))}
    </tr>
  );
}

/**
 * ComparisonPanel Component
 *
 * Shows a side-by-side comparison table of selected competitors.
 * Includes Kel position (if set) as the first column for easy comparison.
 *
 * Features:
 * - Responsive horizontal scroll for many competitors
 * - Remove individual competitors or clear all
 * - Key metrics: market share, scores, price range, channels
 */
export function ComparisonPanel({
  competitors,
  kelPosition,
  onRemove,
  onClearAll,
}: ComparisonPanelProps) {
  // Nothing to compare
  if (competitors.length === 0 && !kelPosition) return null;

  // Build comparison list (Kel first if exists, then selected competitors)
  const comparisonList = kelPosition
    ? [kelPosition, ...competitors.filter((c) => c.id !== kelPosition.id)]
    : competitors;

  // No actual comparison to show (only Kel with no competitors selected)
  if (comparisonList.length < 2 && competitors.length === 0) return null;

  return (
    <div
      data-testid="comparison-panel"
      className="mt-6 bg-card rounded-lg border p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          Comparing {comparisonList.length} {comparisonList.length === 1 ? 'position' : 'positions'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="pb-3 pr-4 text-left text-xs font-medium text-muted-foreground">
                Metric
              </th>
              {comparisonList.map((c) => (
                <th key={c.id} className="pb-3 px-3 text-center min-w-[120px]">
                  <div className="flex items-center justify-center gap-1.5">
                    {c.is_kel_position ? (
                      <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                    ) : (
                      <Circle className="h-3 w-3 text-[var(--chart-competitor)] fill-[var(--chart-competitor)]" />
                    )}
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {c.name}
                    </span>
                    {!c.is_kel_position && (
                      <button
                        onClick={() => onRemove(c.id)}
                        className="ml-1 p-0.5 rounded hover:bg-muted transition-colors"
                        aria-label={`Remove ${c.name} from comparison`}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {c.parent_company && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {c.parent_company}
                    </p>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Category"
              values={comparisonList.map((c) => c.category)}
            />
            <MetricRow
              label="Market Share"
              values={comparisonList.map((c) =>
                c.market_share_percent != null ? `${c.market_share_percent}%` : null
              )}
            />
            <MetricRow
              label="Price Score"
              values={comparisonList.map((c) => `${c.price_score}/10`)}
            />
            <MetricRow
              label="Quality Score"
              values={comparisonList.map((c) => `${c.quality_score}/10`)}
            />
            <MetricRow
              label="Price Range"
              values={comparisonList.map((c) =>
                formatPriceRange(c.price_min_php, c.price_max_php)
              )}
            />
            <MetricRow
              label="Channels"
              values={comparisonList.map((c) => formatChannels(c.primary_channels))}
            />
          </tbody>
        </table>
      </div>

      {/* Tip */}
      {competitors.length === 0 && kelPosition && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Click competitors on the chart to add them to comparison
        </p>
      )}
    </div>
  );
}
