'use client';

import type { CompetitorDataPoint } from '@/types';

/**
 * Position data for an overlay button
 */
export interface OverlayPoint {
  id: string;
  x: number; // pixel position from left
  y: number; // pixel position from top
  name: string;
  priceScore: number;
  qualityScore: number;
  isKel: boolean;
}

export interface ChartClickLayerProps {
  points: OverlayPoint[];
  competitors: CompetitorDataPoint[];
  onPointClick: (competitor: CompetitorDataPoint) => void;
  isMaho: boolean;
}

/**
 * ChartClickLayer - HTML button overlays for reliable chart interactions
 *
 * Renders invisible buttons positioned over each data point in the scatter chart.
 * This solves the Recharts SVG click propagation issue in headless browsers.
 *
 * Features:
 * - 48px minimum touch targets for accessibility compliance
 * - Keyboard accessible (Tab + Enter/Space)
 * - Invisible until hover (preserves chart appearance)
 * - data-testid for E2E test reliability
 */
export function ChartClickLayer({
  points,
  competitors,
  onPointClick,
  isMaho,
}: ChartClickLayerProps) {
  const handleClick = (pointId: string) => {
    const competitor = competitors.find((c) => c.id === pointId);
    if (competitor) {
      onPointClick(competitor);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, pointId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(pointId);
    }
  };

  return (
    <div
      data-testid="chart-click-layer"
      className="absolute inset-0 pointer-events-none"
      aria-hidden={!isMaho}
    >
      {points.map((point) => (
        <button
          key={point.id}
          type="button"
          data-testid={`chart-click-overlay-${point.isKel ? 'kel' : point.id}`}
          data-generic-testid="chart-click-overlay"
          className="absolute min-w-[48px] min-h-[48px] -translate-x-1/2 -translate-y-1/2
                     bg-transparent hover:bg-primary/10 rounded-full z-10
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                     pointer-events-auto disabled:pointer-events-none disabled:opacity-0
                     chart-click-overlay"
          style={{ left: point.x, top: point.y }}
          aria-label={`${point.name}: Price ${point.priceScore}, Quality ${point.qualityScore}${point.isKel ? ' (Kel target)' : ''}`}
          onClick={() => handleClick(point.id)}
          onKeyDown={(e) => handleKeyDown(e, point.id)}
          tabIndex={isMaho ? 0 : -1}
          disabled={!isMaho}
        />
      ))}
    </div>
  );
}
