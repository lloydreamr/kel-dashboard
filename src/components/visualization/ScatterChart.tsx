'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { CompetitorDetailSheet } from '@/components/visualization/CompetitorDetailSheet';
import { OpportunityScoreOverlay } from '@/components/visualization/OpportunityScoreOverlay';
import { QuadrantStatsOverlay } from '@/components/visualization/QuadrantStatsOverlay';
import { ScatterChartSkeleton } from '@/components/visualization/ScatterChartSkeleton';
import { useCompetitorData } from '@/hooks/competitors';
import { useHaptic, useResponsiveChartHeight } from '@/hooks/ui';
import {
  calculateDistanceToKel,
  getThreatAssessment,
  getThreatColorClass,
  getProximityRank,
} from '@/lib/utils/positioning';
import { isStale, getStalenessMessage } from '@/lib/utils/staleness';

import type { CompetitorDataPoint } from '@/types';
import type { ThreatLevel } from '@/lib/utils/positioning';
import type { ChartAxisConfig, ChartMetric } from './ChartAxisSelector';
import { METRIC_CONFIGS, DEFAULT_AXIS_CONFIG } from './ChartAxisSelector';

interface ChartPoint {
  x: number;
  y: number;
  z: number; // Market share for bubble sizing (0-100, defaults to MIN_BUBBLE_SIZE for unknown)
  hasValidXY: boolean; // Phase 3: Whether both axes have valid data (not fallback)
  name: string;
  id: string;
  isKel: boolean;
  updated_at: string;
  // Additional data for enriched tooltips
  marketSharePercent: number | null;
  priceRange: { min: number | null; max: number | null };
  parentCompany: string | null;
  channels: string[] | null;
  category: string | null;
  // Distance to Kel position (for threat assessment)
  distanceToKel: number | null;
  threatLevel: ThreatLevel | null;
  proximityRank: number | null;
  // Phase 1 Enhancements: Additional data dimensions
  distributionReach: number | null; // 0-100%, used for bubble opacity
  skuCount: number | null;
  yearsInMarket: number | null; // Calculated from year_established
  notes: string | null;
  dataCompleteness: number; // 0-100% based on filled fields
  strengths: string[] | null;
  weaknesses: string[] | null;
  // Phase 3: Original scores for tooltip display (always available)
  priceScore: number;
  qualityScore: number;
}

interface ScatterChartProps {
  isMaho: boolean;
  onEditClick: (competitor: CompetitorDataPoint) => void;
  onDeleteClick: (competitor: CompetitorDataPoint) => void;
  /** Callback to open add competitor dialog (used in empty state for Maho) */
  onAddClick?: () => void;
  /** When true, chart enters pitch mode (read-only, no click interactions) */
  isPitchMode?: boolean;
  /** Optional pre-filtered competitors (overrides internal fetch when provided) */
  competitors?: CompetitorDataPoint[];
  /** IDs of competitors selected for comparison panel */
  selectedForComparison?: string[];
  /** Callback to toggle comparison selection */
  onToggleComparison?: (id: string) => void;
  /** Axis configuration for flexible views (Phase 3) */
  axisConfig?: ChartAxisConfig;
}

type Quadrant = 'premium' | 'value' | 'budget' | 'low-quality';

// Chart configuration constants
const MOBILE_CHART_MARGIN = { top: 12, right: 12, bottom: 40, left: 40 };
const DESKTOP_CHART_MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };
const CHART_DOMAIN = { min: 1, max: 10 };

// Bubble sizing configuration
// Z-axis range controls min/max bubble radius in pixels
// Market share 0% → MIN_BUBBLE_SIZE, 100% → MAX_BUBBLE_SIZE
const BUBBLE_SIZE = {
  MIN: 60,   // Minimum bubble area (for 0% or unknown market share)
  MAX: 800,  // Maximum bubble area (for 100% market share)
  DEFAULT: 100, // Default bubble area when market share is unknown
} as const;

// Z-axis domain maps market share percentage to bubble size
const Z_AXIS_DOMAIN = [0, 100] as const;

// Phase 1 Enhancement: Bubble opacity based on distribution reach
// Higher distribution = more solid, lower = more transparent
// Range: 0.35 (0% reach) to 1.0 (100% reach)
const BUBBLE_OPACITY = {
  MIN: 0.35,
  MAX: 1.0,
  DEFAULT: 0.65, // When distribution data is unknown
} as const;

/**
 * Calculate bubble opacity based on distribution reach percentage.
 * Higher distribution reach = more solid/prominent bubble.
 * This visually communicates "reach" alongside "share" (size).
 */
function getBubbleOpacity(distributionReach: number | null): number {
  if (distributionReach === null) return BUBBLE_OPACITY.DEFAULT;
  // Linear interpolation: 0% → MIN, 100% → MAX
  return BUBBLE_OPACITY.MIN + (distributionReach / 100) * (BUBBLE_OPACITY.MAX - BUBBLE_OPACITY.MIN);
}

/**
 * Determine if a competitor is a "major player" (>10% market share)
 * Major players get visual emphasis (bold stroke, subtle glow)
 */
function isMajorPlayer(marketShare: number | null): boolean {
  return marketShare !== null && marketShare > 10;
}

// Axis labels - abbreviated on mobile for space (default view)
const AXIS_LABELS = {
  x: { mobile: 'Price', desktop: 'Price (low → high)' },
  y: { mobile: 'Quality', desktop: 'Quality (low → high)' },
} as const;

/**
 * Get axis label based on selected metric (Phase 3: Flexible Views)
 */
function getAxisLabel(metric: ChartMetric, isMobile: boolean): string {
  const config = METRIC_CONFIGS[metric];
  if (isMobile) {
    return config.shortLabel;
  }
  // Add directional hint for scores
  if (metric === 'price_score' || metric === 'quality_score') {
    return `${config.label} (low → high)`;
  }
  // Add unit for percentages
  if (config.unit === '%') {
    return `${config.label} (%)`;
  }
  return config.label;
}

/**
 * Get metric value from competitor data point.
 * Returns null if the metric is not available for this competitor.
 */
function getMetricValue(
  competitor: CompetitorDataPoint,
  metric: ChartMetric,
  yearsInMarket?: number | null
): number | null {
  switch (metric) {
    case 'price_score':
      return competitor.price_score;
    case 'quality_score':
      return competitor.quality_score;
    case 'market_share':
      return competitor.market_share_percent ?? null;
    case 'distribution_reach':
      return competitor.distribution_reach_percent ?? null;
    case 'sku_count':
      return competitor.sku_count ?? null;
    default:
      return null;
  }
}

export function ScatterChart({ isMaho, onEditClick, onDeleteClick, onAddClick, isPitchMode = false, competitors: externalCompetitors, selectedForComparison = [], onToggleComparison, axisConfig = DEFAULT_AXIS_CONFIG }: ScatterChartProps) {
  const { data: fetchedCompetitors, isLoading, error, refetch } = useCompetitorData();

  // Use external competitors if provided (e.g., filtered), otherwise use fetched data
  const competitors = externalCompetitors ?? fetchedCompetitors;
  const { isMobile, isSmallMobile, chartHeight } = useResponsiveChartHeight();
  const { trigger: triggerHaptic } = useHaptic();
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveredQuadrant, setHoveredQuadrant] = useState<Quadrant | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize chart margin to prevent unnecessary recalculations
  const chartMargin = useMemo(
    () => (isMobile ? MOBILE_CHART_MARGIN : DESKTOP_CHART_MARGIN),
    [isMobile]
  );

  // Memoize axis labels for responsive display (supports flexible axes)
  const axisLabels = useMemo(
    () => ({
      x: getAxisLabel(axisConfig.xMetric, isMobile),
      y: getAxisLabel(axisConfig.yMetric, isMobile),
    }),
    [isMobile, axisConfig.xMetric, axisConfig.yMetric]
  );

  // Memoize axis domains based on selected metrics
  const axisDomains = useMemo(
    () => ({
      x: METRIC_CONFIGS[axisConfig.xMetric].domain,
      y: METRIC_CONFIGS[axisConfig.yMetric].domain,
    }),
    [axisConfig.xMetric, axisConfig.yMetric]
  );

  // Axis label offset - smaller on mobile
  const axisLabelOffset = isMobile ? 12 : 20;

  // Measure container size for ResponsiveContainer rendering
  // Re-run when competitors change to ensure we measure after chart renders
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
    const debouncedUpdateSize = () => {
      clearTimeout(debounceTimer);
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

  // Find Kel position first for distance calculations
  const kelPositionData = competitors.find((c) => c.is_kel_position) ?? null;

  const chartData: ChartPoint[] = competitors.map((c) => {
    const isKel = c.is_kel_position ?? false;
    const distance = isKel ? null : calculateDistanceToKel(c, kelPositionData);
    const threat = distance !== null ? getThreatAssessment(distance) : null;
    const rank = isKel ? null : getProximityRank(c.id, competitors, kelPositionData);

    // Calculate years in market from year_established
    const currentYear = new Date().getFullYear();
    const yearsInMarket = c.year_established ? currentYear - c.year_established : null;

    // Calculate data completeness (% of key fields that are filled)
    // Key fields: market_share, distribution_reach, price range, channels, sku_count, strengths, weaknesses
    const keyFields = [
      c.market_share_percent,
      c.distribution_reach_percent,
      c.price_min_php,
      c.price_max_php,
      c.primary_channels?.length,
      c.sku_count,
      c.strengths?.length,
      c.weaknesses?.length,
      c.year_established,
      c.parent_company,
    ];
    const filledFields = keyFields.filter((f) => f != null && f !== 0).length;
    const dataCompleteness = Math.round((filledFields / keyFields.length) * 100);

    // Phase 3: Flexible axes - get values based on selected metrics
    // Fall back to default position (center of domain) if metric not available
    const xValue = getMetricValue(c, axisConfig.xMetric, yearsInMarket);
    const yValue = getMetricValue(c, axisConfig.yMetric, yearsInMarket);
    const xDomain = METRIC_CONFIGS[axisConfig.xMetric].domain;
    const yDomain = METRIC_CONFIGS[axisConfig.yMetric].domain;
    const xDefault = (xDomain[0] + xDomain[1]) / 2;
    const yDefault = (yDomain[0] + yDomain[1]) / 2;

    // Bubble sizing strategy:
    // - If market share is already shown on an axis, use uniform small bubbles (avoid redundancy)
    // - Otherwise, bubble size encodes market share as additional information dimension
    const marketShareOnAxis = axisConfig.xMetric === 'market_share' || axisConfig.yMetric === 'market_share';
    const uniformBubbleSize = (BUBBLE_SIZE.MIN / BUBBLE_SIZE.MAX) * 100; // Small uniform size
    const marketShareBubbleSize = c.market_share_percent ?? (BUBBLE_SIZE.DEFAULT / BUBBLE_SIZE.MAX) * 100;

    return {
      // Flexible axes: use selected metrics, with fallback for missing data
      x: xValue ?? xDefault,
      y: yValue ?? yDefault,
      // Track if this point has valid data for both axes (for visual indication)
      hasValidXY: xValue !== null && yValue !== null,
      // Z-axis for bubble sizing: view-aware to avoid visual redundancy
      z: marketShareOnAxis ? uniformBubbleSize : marketShareBubbleSize,
      name: c.name,
      id: c.id,
      isKel,
      updated_at: c.updated_at,
      // Additional data for enriched tooltips and detail sheet
      marketSharePercent: c.market_share_percent ?? null,
      priceRange: {
        min: c.price_min_php ?? null,
        max: c.price_max_php ?? null,
      },
      parentCompany: c.parent_company ?? null,
      channels: c.primary_channels ?? null,
      category: c.category ?? null,
      // Distance to Kel position
      distanceToKel: distance,
      threatLevel: threat?.level ?? null,
      proximityRank: rank,
      // Phase 1 Enhancements: Additional data dimensions
      distributionReach: c.distribution_reach_percent ?? null,
      skuCount: c.sku_count ?? null,
      yearsInMarket,
      notes: c.notes ?? null,
      dataCompleteness,
      strengths: c.strengths ?? null,
      weaknesses: c.weaknesses ?? null,
      // Store original scores for tooltip display
      priceScore: c.price_score,
      qualityScore: c.quality_score,
    };
  });

  const kelPosition = chartData.filter((d) => d.isKel);
  const competitorData = chartData.filter((d) => !d.isKel);

  // Phase 3: Check if we're in Position view (price vs quality)
  // Quadrant logic only applies to Position view
  const isPositionView = axisConfig.xMetric === 'price_score' && axisConfig.yMetric === 'quality_score';

  // Calculate gap quadrants (0-1 data points = gap)
  // Only applies in Position view; Using 5.0 as boundary per AC1 requirement
  const quadrantCounts = isPositionView ? {
    premium: chartData.filter((d) => d.x > 5 && d.y > 5).length,
    value: chartData.filter((d) => d.x <= 5 && d.y > 5).length,
    budget: chartData.filter((d) => d.x <= 5 && d.y <= 5).length,
    'low-quality': chartData.filter((d) => d.x > 5 && d.y <= 5).length,
  } : { premium: 99, value: 99, budget: 99, 'low-quality': 99 }; // Disable gaps for non-position views

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
          {/* SVG filters for visual effects */}
          <defs>
            {/* Kel position glow in pitch mode */}
            {isPitchMode && (
              <filter id="kel-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor="var(--primary)"
                  floodOpacity="0.6"
                />
              </filter>
            )}
            {/* Phase 1: Major player glow (>10% market share) */}
            <filter id="major-player-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="2"
                floodColor="var(--chart-competitor)"
                floodOpacity="0.4"
              />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />

          {/* Quadrant divider lines at 5,5 - only shown in Position view per AC1 */}
          {isPositionView && (
            <>
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
            </>
          )}

          {/* Gap area indicators - show only in Position view for quadrants with 0-1 data points */}
          {isPositionView && gapQuadrants.includes('premium') && (
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
            />
          )}
          {isPositionView && gapQuadrants.includes('value') && (
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
            />
          )}
          {isPositionView && gapQuadrants.includes('budget') && (
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
            />
          )}
          {isPositionView && gapQuadrants.includes('low-quality') && (
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
            />
          )}

          <XAxis
            type="number"
            dataKey="x"
            domain={axisDomains.x}
            name={METRIC_CONFIGS[axisConfig.xMetric].label}
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
            domain={axisDomains.y}
            name={METRIC_CONFIGS[axisConfig.yMetric].label}
            data-testid="chart-y-axis"
            label={{
              value: axisLabels.y,
              angle: -90,
              position: 'left',
              offset: axisLabelOffset,
            }}
          />

          {/* Z-axis controls bubble size based on market share */}
          <ZAxis
            type="number"
            dataKey="z"
            domain={Z_AXIS_DOMAIN}
            range={[BUBBLE_SIZE.MIN, BUBBLE_SIZE.MAX]}
            name="Market Share"
          />

          <RechartsTooltip
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
                const hasPriceRange = data.priceRange.min !== null || data.priceRange.max !== null;
                const priceRangeText = hasPriceRange
                  ? `₱${data.priceRange.min ?? '?'} - ₱${data.priceRange.max ?? '?'}`
                  : null;
                const majorPlayer = isMajorPlayer(data.marketSharePercent);

                return (
                  <div className="bg-popover border rounded-md p-3 shadow-md min-w-[200px] max-w-[280px]">
                    {/* Header with name and badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {data.name}
                          {majorPlayer && <span className="ml-1 text-amber-500">★</span>}
                        </p>
                        {data.parentCompany && (
                          <p className="text-xs text-muted-foreground">{data.parentCompany}</p>
                        )}
                      </div>
                      {data.marketSharePercent !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                          majorPlayer ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-primary/10 text-primary'
                        }`}>
                          {data.marketSharePercent}%
                        </span>
                      )}
                    </div>

                    {/* Category and data completeness */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {data.category && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {data.category}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        data.dataCompleteness >= 70 ? 'bg-green-50 text-green-600' :
                        data.dataCompleteness >= 40 ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {data.dataCompleteness}% data
                      </span>
                    </div>

                    {/* Core metrics grid */}
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Price: {data.x}/10</span>
                      <span>Quality: {data.y}/10</span>
                      {data.distributionReach !== null && (
                        <span>Reach: {data.distributionReach}%</span>
                      )}
                      {data.skuCount !== null && (
                        <span>SKUs: {data.skuCount}</span>
                      )}
                      {data.yearsInMarket !== null && (
                        <span>{data.yearsInMarket}y in market</span>
                      )}
                    </div>

                    {/* Price range */}
                    {priceRangeText && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {priceRangeText}
                      </p>
                    )}

                    {/* Distribution channels */}
                    {data.channels && data.channels.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        📍 {data.channels.slice(0, 3).join(', ')}{data.channels.length > 3 ? '...' : ''}
                      </p>
                    )}

                    {/* Notes preview */}
                    {data.notes && (
                      <p className="text-[10px] text-muted-foreground mt-2 pt-1 border-t italic line-clamp-2">
                        &quot;{data.notes.slice(0, 80)}{data.notes.length > 80 ? '...' : ''}&quot;
                      </p>
                    )}

                    {/* Distance to Kel */}
                    {!data.isKel && data.threatLevel && data.distanceToKel !== null && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getThreatColorClass(data.threatLevel)}`}>
                          {data.threatLevel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {data.distanceToKel.toFixed(1)} from Kel
                        </span>
                      </div>
                    )}

                    {/* Staleness warning */}
                    {pointIsStale && (
                      <p className="text-xs text-amber-600 mt-2 border-t pt-2">
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
              const majorPlayer = isMajorPlayer(entry.marketSharePercent);

              // Opacity encoding is view-aware:
              // - Position view: Opacity encodes distribution reach (adds information)
              // - Other views: Use solid opacity (0.85) since axis already shows the metric
              // This prevents "outline-only" appearance when major players have strokes
              const opacity = isPositionView
                ? getBubbleOpacity(entry.distributionReach)
                : 0.85;

              // Stale points get additional 50% transparency
              const baseOpacity = pointIsStale ? opacity * 0.5 : opacity;

              // Major player stroke is only shown in Position view where it adds
              // semantic meaning (market dominance). In other views, use solid fill only
              // to prevent the "outline circle" appearance.
              const showMajorStroke = isPositionView && majorPlayer;

              return (
                <Cell
                  key={entry.id}
                  id={entry.id}
                  data-testid={pointIsStale ? 'stale-chart-point' : 'chart-data-point'}
                  fill="var(--chart-competitor)"
                  fillOpacity={baseOpacity}
                  stroke={showMajorStroke ? 'var(--chart-competitor)' : 'none'}
                  strokeWidth={showMajorStroke ? 2 : 0}
                  filter={showMajorStroke ? 'url(#major-player-glow)' : undefined}
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

          {/* Quadrant Labels - only shown in Position view, hidden on small mobile (< 375px) */}
          {!isSmallMobile && isPositionView && (
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

        {/* Quadrant Statistics Overlay - shows aggregate stats in each quadrant corner */}
        {/* Only show in Position view (Price vs Quality) where quadrants are meaningful */}
        {!isPitchMode && hasValidDimensions && competitors && isPositionView && (
          <QuadrantStatsOverlay
            competitors={competitors}
            isVisible={!isSmallMobile}
          />
        )}

        {/* Opportunity Score Overlay - shows strategic opportunity scores per quadrant */}
        {/* Only show in Position view (Price vs Quality) where quadrants are meaningful */}
        {!isPitchMode && hasValidDimensions && competitors && isPositionView && (
          <OpportunityScoreOverlay
            competitors={competitors}
            kelPosition={competitors.find((c) => c.is_kel_position) ?? null}
            isVisible={!isSmallMobile}
          />
        )}

        {/* Proximity Ranking Panel has been moved to ChartStatsBar (Issue 1 fix)
            The threat summary now appears in the stats bar with a click-to-expand popover,
            providing better visibility and reducing chart overlay clutter. */}

        {/* Note: HTML click overlays removed - SVG dots are now directly clickable
            via Recharts Scatter onClick handlers. Tooltips are provided by RechartsTooltip.
            This eliminates overlapping click target issues with closely-positioned data points. */}
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
          isSelectedForComparison={selectedForComparison.includes(selectedCompetitor.id)}
          onToggleComparison={onToggleComparison ? () => onToggleComparison(selectedCompetitor.id) : undefined}
          kelPosition={kelPositionData}
          proximityRank={getProximityRank(selectedCompetitor.id, competitors, kelPositionData)}
        />
      )}
    </div>
  );
}
