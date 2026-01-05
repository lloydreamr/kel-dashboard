'use client';

import { Circle, Star } from 'lucide-react';

interface ChartLegendProps {
  hasKelPosition: boolean;
  isLoading?: boolean;
}

/**
 * ChartLegend Component
 *
 * Displays legend for scatter chart showing marker types.
 * Positioned below chart with responsive wrapping.
 *
 * AC1: Shows Circle (competitor) and Star (Kel) markers
 * AC3: Responsive positioning below chart
 * AC5: Hidden during loading state
 *
 * Note: Category toggles removed per Epic 6 retrospective action item.
 * The feature was UI-only (didn't filter chart) and added unnecessary complexity.
 */
export function ChartLegend({ hasKelPosition, isLoading }: ChartLegendProps) {
  // AC5: Hide during loading
  if (isLoading) return null;

  return (
    <div
      role="group"
      aria-label="Chart legend"
      data-testid="chart-legend"
      className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mt-4"
    >
      {/* AC1: Competitor marker - always visible */}
      <div data-testid="legend-competitor-marker" className="flex items-center gap-2 text-sm">
        <Circle className="h-4 w-4 fill-muted-foreground text-muted-foreground" />
        <span className="text-muted-foreground">Competitor</span>
      </div>

      {/* AC1: Kel marker - conditional */}
      {hasKelPosition && (
        <div data-testid="legend-kel-marker" className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="text-foreground">Kel Target Position</span>
        </div>
      )}
    </div>
  );
}
