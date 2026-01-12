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
import { CompetitorDetailSheet } from '@/components/visualization/CompetitorDetailSheet';
import { ScatterChartSkeleton } from '@/components/visualization/ScatterChartSkeleton';
import { useCompetitorData } from '@/hooks/competitors';
import { useHaptic, useResponsiveChartHeight } from '@/hooks/ui';
import { isStale, getStalenessMessage } from '@/lib/utils/staleness';

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
  /** When true, chart enters pitch mode (read-only, no click interactions) */
  isPitchMode?: boolean;
}

type Quadrant = 'premium' | 'value' | 'budget' | 'low-quality';

// Chart configuration constants
const MOBILE_CHART_MARGIN = { top: 12, right: 12, bottom: 40, left: 40 };
const DESKTOP_CHART_MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };
const CHART_DOMAIN = { min: 1, max: 10 };

// Helper to calculate pixel position from data coordinates
// Used for HTML click overlay positioning
function getPixelPosition(
  dataX: number,
  dataY: number,
  containerWidth: number,
  containerHeight: number,
  margin: typeof MOBILE_CHART_MARGIN
): { x: number; y: number } {
  const plotWidth = containerWidth - margin.left - margin.right;
  const plotHeight = containerHeight - margin.top - margin.bottom;
  const domainRange = CHART_DOMAIN.max - CHART_DOMAIN.min;

  // X: left to right
  const x = margin.left + ((dataX - CHART_DOMAIN.min) / domainRange) * plotWidth;
  // Y: inverted (top is high, bottom is low in SVG coordinates)
  const y = margin.top + ((CHART_DOMAIN.max - dataY) / domainRange) * plotHeight;

  return { x, y };
}

// Axis labels - abbreviated on mobile for space
const AXIS_LABELS = {
  x: { mobile: 'Price', desktop: 'Price (low → high)' },
  y: { mobile: 'Quality', desktop: 'Quality (low → high)' },
} as const;

export function ScatterChart({ isMaho, onEditClick, onDeleteClick, onAddClick, isPitchMode = false }: ScatterChartProps) {
  const { data: competitors, isLoading, error, refetch } = useCompetitorData();
  const { isMobile, isSmallMobile, chartHeight } = useResponsiveChartHeight();
  const { trigger: triggerHaptic } = useHaptic();
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveredQuadrant, setHoveredQuadrant] = useState<Quadrant | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // SVG positions read from Recharts after render - ensures perfect alignment
  // Includes resizeKey to invalidate stale positions on viewport changes
  const [svgPositions, setSvgPositions] = useState<{
    positions: Map<string, { x: number; y: number }>;
    resizeKey: number;
  }>({ positions: new Map(), resizeKey: 0 });
  // Resize counter to track viewport changes - increments on each resize
  const resizeCounterRef = useRef(0);

  // Memoize chart margin to prevent unnecessary recalculations
  const chartMargin = useMemo(
    () => (isMobile ? MOBILE_CHART_MARGIN : DESKTOP_CHART_MARGIN),
    [isMobile]
  );

  // Memoize axis labels for responsive display
  const axisLabels = useMemo(
    () => ({
      x: isMobile ? AXIS_LABELS.x.mobile : AXIS_LABELS.x.desktop,
      y: isMobile ? AXIS_LABELS.y.mobile : AXIS_LABELS.y.desktop,
    }),
    [isMobile]
  );

  // Axis label offset - smaller on mobile
  const axisLabelOffset = isMobile ? 12 : 20;

  // Measure container size for overlay positioning
  // Re-run when competitors change to ensure we measure after chart renders
  // Debounced to prevent reading positions during resize transitions
  useEffect(() => {
    if (!containerRef.current) return;

    let rafId: number;
    let debounceTimer: NodeJS.Timeout;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Only update if we have valid dimensions
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
          // Wait one animation frame after getting valid dimensions to ensure
          // layout is complete before rendering ResponsiveContainer
          rafId = requestAnimationFrame(() => {
            setIsContainerReady(true);
          });
        }
      }
    };

    // Debounced version for resize events - waits for resize to stabilize
    // Immediately clears positions to prevent showing stale overlays during resize
    const debouncedUpdateSize = () => {
      clearTimeout(debounceTimer);
      // Increment resize counter immediately to invalidate in-flight position reads
      resizeCounterRef.current += 1;
      // Clear positions immediately so stale overlays aren't shown during resize
      setSvgPositions({ positions: new Map(), resizeKey: resizeCounterRef.current });
      debounceTimer = setTimeout(updateSize, 150); // Wait 150ms after last resize event
    };

    // Initial measurement (may run before layout is complete)
    updateSize();

    // Update on resize with debouncing to avoid intermediate states
    const resizeObserver = new ResizeObserver(debouncedUpdateSize);
    resizeObserver.observe(containerRef.current);

    // Fallback: Retry measurement after layout settles
    const fallbackTimer = setTimeout(updateSize, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(fallbackTimer);
      clearTimeout(debounceTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [competitors]);

  // Read actual SVG positions from Recharts after render for perfect overlay alignment
  // Recharts' internal positioning can differ from our calculations, so we read the
  // rendered cx/cy attributes directly from the SVG path elements
  //
  // IMPORTANT: Position Stability Check
  // After viewport resize, Recharts updates SVG dimensions BEFORE updating path positions.
  // We must verify positions have STABILIZED by comparing multiple consecutive reads.
  useEffect(() => {
    if (!containerRef.current || !isContainerReady || !containerSize) return;

    // Increment resize counter to invalidate any in-flight position reads
    // This ensures stale positions from previous viewport are never rendered
    resizeCounterRef.current += 1;
    const currentResizeKey = resizeCounterRef.current;

    // Clear stale positions immediately when container size changes
    // Using the resize key ensures we know which positions are current
    setSvgPositions({ positions: new Map(), resizeKey: currentResizeKey });

    let attempts = 0;
    const maxAttempts = 20; // Increased to handle slower renders
    let timeoutId: NodeJS.Timeout;

    // Track previous positions for stability check
    let previousPositions: Map<string, { x: number; y: number }> | null = null;
    let stabilityCount = 0;
    const requiredStabilityCount = 2; // Positions must match 2 consecutive reads

    const readSvgPositions = () => {
      // Abort if another resize happened (stale read)
      if (resizeCounterRef.current !== currentResizeKey) return;

      const svg = containerRef.current?.querySelector('svg');
      if (!svg) {
        if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(readSvgPositions, 50);
        }
        return;
      }

      // Verify SVG dimensions match container (ensures Recharts has finished rendering)
      const svgWidth = parseInt(svg.getAttribute('width') || '0', 10);
      const svgHeight = parseInt(svg.getAttribute('height') || '0', 10);

      // Allow tolerance for rounding differences
      const widthMatch = Math.abs(svgWidth - containerSize.width) < 10;
      const heightMatch = Math.abs(svgHeight - containerSize.height) < 10;

      if (!widthMatch || !heightMatch) {
        // Reset stability tracking when dimensions don't match
        previousPositions = null;
        stabilityCount = 0;
        if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(readSvgPositions, 50);
        }
        return;
      }

      // Final check: abort if another resize happened during validation
      if (resizeCounterRef.current !== currentResizeKey) return;

      // Query both regular data points AND Kel position markers
      const paths = svg.querySelectorAll('.recharts-scatter path[data-testid="chart-data-point"], .recharts-scatter path[data-testid="chart-kel-position"]');
      const newPositions = new Map<string, { x: number; y: number }>();

      paths.forEach((path) => {
        const id = path.getAttribute('id');
        const cx = parseFloat(path.getAttribute('cx') || '0');
        const cy = parseFloat(path.getAttribute('cy') || '0');
        if (id && !isNaN(cx) && !isNaN(cy)) {
          newPositions.set(id, { x: cx, y: cy });
        }
      });

      if (newPositions.size > 0) {
        // STABILITY CHECK: Compare with previous read
        // Recharts can return transitional positions during re-layout
        // Only accept positions that are consistent across multiple reads
        let positionsStable = false;

        if (previousPositions && previousPositions.size === newPositions.size) {
          positionsStable = true;
          for (const [id, pos] of newPositions) {
            const prevPos = previousPositions.get(id);
            // Allow 1px tolerance for floating point differences
            if (!prevPos || Math.abs(prevPos.x - pos.x) > 1 || Math.abs(prevPos.y - pos.y) > 1) {
              positionsStable = false;
              break;
            }
          }
        }

        if (positionsStable) {
          stabilityCount++;
        } else {
          stabilityCount = 0;
        }

        // Store current positions for next comparison
        previousPositions = newPositions;

        // Only update state if positions have been stable for consecutive reads
        if (stabilityCount >= requiredStabilityCount && resizeCounterRef.current === currentResizeKey) {
          setSvgPositions({ positions: newPositions, resizeKey: currentResizeKey });
          return; // Success - stop retrying
        }
      }

      // Retry to verify stability
      if (attempts < maxAttempts) {
        attempts++;
        timeoutId = setTimeout(readSvgPositions, 60); // Check every 60ms for stability
      }
    };

    // Start reading after a delay to let Recharts begin rendering
    // Longer initial delay to let Recharts settle after resize
    timeoutId = setTimeout(readSvgPositions, 200);

    return () => clearTimeout(timeoutId);
  }, [isContainerReady, competitors, containerSize]);

  if (isLoading) {
    return <ScatterChartSkeleton />;
  }

  if (error) {
    return (
      <div
        data-testid="scatter-chart-error"
        className="w-full flex items-center justify-center"
        style={{ height: chartHeight }}
      >
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load chart data</p>
          <button
            data-testid="retry-button"
            onClick={() => refetch()}
            className="min-h-12 text-sm text-primary hover:underline"
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
        className="w-full flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20"
        style={{ height: chartHeight }}
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
              className="min-h-12"
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

  // Check if container has valid dimensions to prevent Recharts warning
  // Also wait for isContainerReady to ensure layout is complete before rendering ResponsiveContainer
  // In test environment (NODE_ENV=test), skip the check since jsdom doesn't provide real dimensions
  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const hasValidDimensions = isTestEnv || (isContainerReady && containerSize && containerSize.width > 0 && containerSize.height > 0);

  // Use fixed pixel dimensions for tests (jsdom doesn't support percentage sizing)
  // In production, use actual container dimensions or fallback to 100%
  const chartWidth = isTestEnv ? 800 : (containerSize?.width ?? '100%');
  const chartHeightPx = isTestEnv ? 400 : (containerSize?.height ?? '100%');

  return (
    <div
      data-testid={isPitchMode ? 'pitch-mode-chart' : 'scatter-chart'}
      className="w-full"
      style={{ height: chartHeight }}
    >
      <div ref={containerRef} className="relative w-full h-full">
        {!hasValidDimensions ? (
          <ScatterChartSkeleton />
        ) : (
        <ResponsiveContainer width={chartWidth} height={chartHeightPx}>
        <RechartsScatter margin={chartMargin}>
          {/* SVG filter for Kel position glow in pitch mode */}
          {isPitchMode && (
            <defs>
              <filter id="kel-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="var(--primary)"
                  floodOpacity="0.6"
                />
              </filter>
            </defs>
          )}
          <CartesianGrid strokeDasharray="3 3" />

          {/* Quadrant divider lines at 5,5 per AC1 */}
          <ReferenceLine
            x={5}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            opacity={0.5}
            data-testid="chart-quadrant-line-vertical"
          />
          <ReferenceLine
            y={5}
            stroke="var(--muted-foreground)"
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
              fill="var(--muted)"
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
              fill="var(--muted)"
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
              fill="var(--muted)"
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
              fill="var(--muted)"
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
              value: axisLabels.x,
              position: 'bottom',
              offset: axisLabelOffset,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[1, 10]}
            name="Quality"
            data-testid="chart-y-axis"
            label={{
              value: axisLabels.y,
              angle: -90,
              position: 'left',
              offset: axisLabelOffset,
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
            fill="var(--chart-competitor)"
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
                    ? 'color-mix(in srgb, var(--chart-competitor) 50%, transparent)'
                    : 'var(--chart-competitor)'
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
              fill="var(--primary)"
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
                <Cell
                  key={entry.id}
                  data-testid={isPitchMode ? 'kel-position-highlight' : 'chart-kel-position'}
                  filter={isPitchMode ? 'url(#kel-glow)' : undefined}
                />
              ))}
            </Scatter>
          )}

          {/* Quadrant Labels - hidden on small mobile (< 375px) to prevent overlap */}
          {!isSmallMobile && (
            <>
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
            </>
          )}

        </RechartsScatter>
      </ResponsiveContainer>
        )}

        {/* HTML Click Overlay Layer for accessible click targets (Story 6.7)
            Provides reliable click handling for E2E tests and screen readers.
            Uses SVG positions read from Recharts for perfect alignment.
            Only rendered for Maho (Kel has read-only access) */}
        {isMaho && !isPitchMode && containerSize && containerSize.width > 0 && (
          <div
            data-testid="chart-click-layer"
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {chartData.map((point) => {
              // Only render overlays when we have confirmed SVG positions
              // This prevents misaligned overlays during resize transitions
              const svgPos = svgPositions.positions.get(point.id);
              if (!svgPos) return null; // Don't render until SVG position is confirmed

              const competitor = competitors?.find((c) => c.id === point.id);
              if (!competitor) return null;

              return (
                <button
                  key={point.id}
                  data-testid="chart-click-overlay"
                  data-generic-testid="chart-click-overlay"
                  className={`chart-click-overlay absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-auto cursor-pointer
                    border-2 border-transparent
                    hover:border-primary/40 hover:bg-primary/15 hover:scale-110
                    focus:border-primary focus:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    active:scale-95
                    transition-all duration-200 ease-out
                    ${point.isKel ? 'ring-1 ring-primary/30' : 'ring-1 ring-muted-foreground/20'}`}
                  style={{ left: svgPos.x, top: svgPos.y }}
                  aria-label={`Click to edit ${point.name}: Price ${point.x}, Quality ${point.y}${point.isKel ? ' (Kel Target)' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPopoverAnchor({ x: rect.left + rect.width / 2, y: rect.top });
                    setSelectedCompetitor(competitor);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Edit popover (desktop) or bottom sheet (mobile) for clicked data points */}
      {selectedCompetitor && popoverAnchor && (
        <CompetitorDetailSheet
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
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
