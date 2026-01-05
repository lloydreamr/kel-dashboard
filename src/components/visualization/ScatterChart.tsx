'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { ChartClickLayer } from '@/components/visualization/ChartClickLayer';
import { CompetitorEditPopover } from '@/components/visualization/CompetitorEditPopover';
import { ScatterChartSkeleton } from '@/components/visualization/ScatterChartSkeleton';
import { useCompetitorData } from '@/hooks/competitors';
import { isStale, getStalenessMessage } from '@/lib/utils/staleness';

import type { OverlayPoint } from '@/components/visualization/ChartClickLayer';
import type { CompetitorDataPoint } from '@/types';

interface ChartPoint {
  x: number;
  y: number;
  name: string;
  id: string;
  isKel: boolean;
  updated_at: string;
}

interface ScatterChartProps {
  isMaho: boolean;
  onEditClick: (competitor: CompetitorDataPoint) => void;
  onDeleteClick: (competitor: CompetitorDataPoint) => void;
  /** Callback to open add competitor dialog (used in empty state for Maho) */
  onAddClick?: () => void;
}

type Quadrant = 'premium' | 'value' | 'budget' | 'low-quality';

// Chart configuration constants
const CHART_MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };
const CHART_DOMAIN = { min: 1, max: 10 };

export function ScatterChart({ isMaho, onEditClick, onDeleteClick, onAddClick }: ScatterChartProps) {
  const { data: competitors, isLoading, error, refetch } = useCompetitorData();
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveredQuadrant, setHoveredQuadrant] = useState<Quadrant | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container size for overlay positioning
  // Re-run when competitors change to ensure we measure after chart renders
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Only update if we have valid dimensions
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };

    // Initial measurement (may run before layout is complete)
    updateSize();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Fallback: Retry measurement after layout settles
    const fallbackTimer = setTimeout(updateSize, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [competitors]);

  // Calculate overlay positions when data or container size changes
  // Using useMemo to derive state without causing cascading renders
  const overlayPoints = useMemo<OverlayPoint[]>(() => {
    if (!containerSize || !competitors || competitors.length === 0) return [];

    const { width, height } = containerSize;
    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const chartHeight = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
    const domainRange = CHART_DOMAIN.max - CHART_DOMAIN.min;

    // Convert data value to pixel position
    const xToPixel = (value: number) =>
      CHART_MARGIN.left + ((value - CHART_DOMAIN.min) / domainRange) * chartWidth;
    const yToPixel = (value: number) =>
      CHART_MARGIN.top + ((CHART_DOMAIN.max - value) / domainRange) * chartHeight;

    return competitors.map((c) => ({
      id: c.id,
      x: xToPixel(c.price_score),
      y: yToPixel(c.quality_score),
      name: c.name,
      priceScore: c.price_score,
      qualityScore: c.quality_score,
      isKel: c.is_kel_position ?? false,
    }));
  }, [containerSize, competitors]);

  // Handle click from ChartClickLayer
  // Don't use useCallback to avoid stale closure issues - re-create each render
  const handleOverlayClick = (competitor: CompetitorDataPoint) => {
    if (!containerRef.current) return;

    // Get fresh container dimensions directly from the DOM
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // Calculate popover position directly from competitor data
    const chartWidth = containerRect.width - CHART_MARGIN.left - CHART_MARGIN.right;
    const chartHeight = containerRect.height - CHART_MARGIN.top - CHART_MARGIN.bottom;
    const domainRange = CHART_DOMAIN.max - CHART_DOMAIN.min;

    const xToPixel = (value: number) =>
      CHART_MARGIN.left + ((value - CHART_DOMAIN.min) / domainRange) * chartWidth;
    const yToPixel = (value: number) =>
      CHART_MARGIN.top + ((CHART_DOMAIN.max - value) / domainRange) * chartHeight;

    setPopoverAnchor({
      x: containerRect.left + xToPixel(competitor.price_score),
      y: containerRect.top + yToPixel(competitor.quality_score),
    });
    setSelectedCompetitor(competitor);
  };

  if (isLoading) {
    return <ScatterChartSkeleton />;
  }

  if (error) {
    return (
      <div
        data-testid="scatter-chart-error"
        className="w-full h-[400px] flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load chart data</p>
          <button
            data-testid="retry-button"
            onClick={() => refetch()}
            className="min-h-[48px] text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state - role-specific messaging (AC: #1, #2, #5)
  if (!competitors || competitors.length === 0) {
    return (
      <div
        data-testid="visualization-empty-state"
        role="status"
        aria-label="No competitor data available"
        className="w-full h-[400px] flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20"
      >
        <div className="text-center p-8">
          <p className="text-muted-foreground mb-2">No competitor data yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            {isMaho
              ? 'Add your first competitor to see the positioning chart.'
              : 'Maho will add competitors for positioning analysis.'}
          </p>
          {isMaho && onAddClick && (
            <Button
              onClick={onAddClick}
              data-testid="empty-state-action"
              className="min-h-[48px]"
            >
              Add Competitor
            </Button>
          )}
        </div>
      </div>
    );
  }

  const chartData: ChartPoint[] = competitors.map((c) => ({
    x: c.price_score,
    y: c.quality_score,
    name: c.name,
    id: c.id,
    isKel: c.is_kel_position ?? false,
    updated_at: c.updated_at,
  }));


  const kelPosition = chartData.filter((d) => d.isKel);
  const competitorData = chartData.filter((d) => !d.isKel);

  // Calculate gap quadrants (0-1 data points = gap)
  // Using 5.0 as boundary per AC1 requirement
  const quadrantCounts = {
    premium: chartData.filter((d) => d.x > 5 && d.y > 5).length,
    value: chartData.filter((d) => d.x <= 5 && d.y > 5).length,
    budget: chartData.filter((d) => d.x <= 5 && d.y <= 5).length,
    'low-quality': chartData.filter((d) => d.x > 5 && d.y <= 5).length,
  };

  const gapQuadrants: Quadrant[] = (Object.entries(quadrantCounts) as [Quadrant, number][])
    .filter(([, count]) => count <= 1)
    .map(([quadrant]) => quadrant);

  return (
    <div data-testid="scatter-chart" className="w-full h-[400px]">
      <div ref={containerRef} className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
        <RechartsScatter margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* Quadrant divider lines at 5,5 per AC1 */}
          <ReferenceLine
            x={5}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            opacity={0.5}
            data-testid="chart-quadrant-line-vertical"
          />
          <ReferenceLine
            y={5}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            opacity={0.5}
            data-testid="chart-quadrant-line-horizontal"
          />

          {/* Gap area indicators - show only for quadrants with 0-1 data points */}
          {gapQuadrants.includes('premium') && (
            <ReferenceArea
              x1={5}
              x2={10}
              y1={5}
              y2={10}
              fill="hsl(var(--muted))"
              fillOpacity={hoveredQuadrant === 'premium' ? 0.2 : 0.05}
              stroke="none"
              data-testid="gap-indicator"
              onMouseEnter={() => setHoveredQuadrant('premium')}
              onMouseLeave={() => setHoveredQuadrant(null)}
              onFocus={() => setHoveredQuadrant('premium')}
              onBlur={() => setHoveredQuadrant(null)}
            />
          )}
          {gapQuadrants.includes('value') && (
            <ReferenceArea
              x1={1}
              x2={5}
              y1={5}
              y2={10}
              fill="hsl(var(--muted))"
              fillOpacity={hoveredQuadrant === 'value' ? 0.2 : 0.05}
              stroke="none"
              data-testid="gap-indicator"
              onMouseEnter={() => setHoveredQuadrant('value')}
              onMouseLeave={() => setHoveredQuadrant(null)}
              onFocus={() => setHoveredQuadrant('value')}
              onBlur={() => setHoveredQuadrant(null)}
            />
          )}
          {gapQuadrants.includes('budget') && (
            <ReferenceArea
              x1={1}
              x2={5}
              y1={1}
              y2={5}
              fill="hsl(var(--muted))"
              fillOpacity={hoveredQuadrant === 'budget' ? 0.2 : 0.05}
              stroke="none"
              data-testid="gap-indicator"
              onMouseEnter={() => setHoveredQuadrant('budget')}
              onMouseLeave={() => setHoveredQuadrant(null)}
              onFocus={() => setHoveredQuadrant('budget')}
              onBlur={() => setHoveredQuadrant(null)}
            />
          )}
          {gapQuadrants.includes('low-quality') && (
            <ReferenceArea
              x1={5}
              x2={10}
              y1={1}
              y2={5}
              fill="hsl(var(--muted))"
              fillOpacity={hoveredQuadrant === 'low-quality' ? 0.2 : 0.05}
              stroke="none"
              data-testid="gap-indicator"
              onMouseEnter={() => setHoveredQuadrant('low-quality')}
              onMouseLeave={() => setHoveredQuadrant(null)}
              onFocus={() => setHoveredQuadrant('low-quality')}
              onBlur={() => setHoveredQuadrant(null)}
            />
          )}

          <XAxis
            type="number"
            dataKey="x"
            domain={[1, 10]}
            name="Price"
            data-testid="chart-x-axis"
            label={{
              value: 'Price (low → high)',
              position: 'bottom',
              offset: 20,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[1, 10]}
            name="Quality"
            data-testid="chart-y-axis"
            label={{
              value: 'Quality (low → high)',
              angle: -90,
              position: 'left',
              offset: 20,
            }}
          />

          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              // Show gap area tooltip when hovering over a gap quadrant
              if (hoveredQuadrant) {
                return (
                  <div className="bg-popover border rounded-md p-2 shadow-md">
                    <p className="text-sm font-medium">Potential gap area</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {hoveredQuadrant.replace('-', ' ')} quadrant
                    </p>
                  </div>
                );
              }

              // Show data point tooltip when hovering over a competitor
              if (active && payload && payload.length) {
                const data = payload[0].payload as ChartPoint;
                const pointIsStale = isStale(data.updated_at);
                return (
                  <div className="bg-popover border rounded-md p-2 shadow-md">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Price: {data.x} | Quality: {data.y}
                    </p>
                    {pointIsStale && (
                      <p className="text-xs text-warning mt-1">
                        {getStalenessMessage(data.updated_at)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Competitor data points */}
          <Scatter
            name="Competitors"
            data={competitorData}
            fill="hsl(var(--muted-foreground))"
            onClick={(data, _index, event) => {
              if (!isMaho) return;

              const point = data.payload as ChartPoint;
              const rect = (event.target as SVGElement).getBoundingClientRect();
              setPopoverAnchor({ x: rect.left + rect.width / 2, y: rect.top });

              const competitor = competitors?.find((c) => c.id === point.id);
              if (competitor) {
                setSelectedCompetitor(competitor);
              }
            }}
            style={{ cursor: isMaho ? 'pointer' : 'default' }}
          >
            {competitorData.map((entry) => {
              const pointIsStale = isStale(entry.updated_at);
              return (
                <Cell
                  key={entry.id}
                  data-testid={pointIsStale ? 'stale-chart-point' : 'chart-data-point'}
                  fill={pointIsStale
                    ? 'hsl(var(--muted-foreground) / 0.5)'
                    : 'hsl(var(--muted-foreground))'
                  }
                />
              );
            })}
          </Scatter>

          {/* Kel's target position - distinct star marker */}
          {kelPosition.length > 0 && (
            <Scatter
              name="Kel Target"
              data={kelPosition}
              fill="hsl(var(--primary))"
              shape="star"
              onClick={(data, _index, event) => {
                if (!isMaho) return;

                const point = data.payload as ChartPoint;
                const rect = (event.target as SVGElement).getBoundingClientRect();
                setPopoverAnchor({ x: rect.left + rect.width / 2, y: rect.top });

                const competitor = competitors?.find((c) => c.id === point.id);
                if (competitor) {
                  setSelectedCompetitor(competitor);
                }
              }}
              style={{ cursor: isMaho ? 'pointer' : 'default' }}
            >
              {kelPosition.map((entry) => (
                <Cell key={entry.id} data-testid="chart-kel-position" />
              ))}
            </Scatter>
          )}

          {/* Quadrant Labels */}
          <text
            x="82%"
            y="15%"
            textAnchor="middle"
            fill="currentColor"
            className="text-xs opacity-40"
          >
            Premium
          </text>
          <text
            x="18%"
            y="15%"
            textAnchor="middle"
            fill="currentColor"
            className="text-xs opacity-40"
          >
            Value
          </text>
          <text
            x="18%"
            y="85%"
            textAnchor="middle"
            fill="currentColor"
            className="text-xs opacity-40"
          >
            Budget
          </text>
          <text
            x="82%"
            y="85%"
            textAnchor="middle"
            fill="currentColor"
            className="text-xs opacity-40"
          >
            Low Quality
          </text>

        </RechartsScatter>
      </ResponsiveContainer>

      {/* HTML click overlays for reliable E2E testing */}
      {competitors && (
        <ChartClickLayer
          points={overlayPoints}
          competitors={competitors}
          onPointClick={handleOverlayClick}
          isMaho={isMaho}
        />
      )}
      </div>

      {/* Edit popover for clicked data points */}
      {selectedCompetitor && popoverAnchor && (
        <CompetitorEditPopover
          competitor={selectedCompetitor}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCompetitor(null);
              setPopoverAnchor(null);
            }
          }}
          anchorPoint={popoverAnchor}
          onEdit={() => {
            onEditClick(selectedCompetitor);
            setSelectedCompetitor(null);
            setPopoverAnchor(null);
          }}
          onDelete={() => {
            onDeleteClick(selectedCompetitor);
            setSelectedCompetitor(null);
            setPopoverAnchor(null);
          }}
        />
      )}
    </div>
  );
}
