'use client';

/**
 * @fileoverview Chart Axis Selector - Flexible View Controls
 *
 * Allows users to change what metrics are plotted on X and Y axes.
 * Includes preset views for common analysis perspectives:
 * - Position View: Price vs Quality (default, classic positioning chart)
 * - Distribution View: Distribution Reach vs Market Share
 * - Reach View: Price vs Distribution Reach
 * - Portfolio View: Quality vs SKU Count
 *
 * Phase 3 Enhancement: Flexible Views for deeper analysis.
 */

import { useMemo } from 'react';
import {
  BarChart3,
  Grid3X3,
  Layers,
  TrendingUp,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Available metrics for chart axes.
 * Each metric has display properties and data accessor configuration.
 */
export type ChartMetric =
  | 'price_score'
  | 'quality_score'
  | 'market_share'
  | 'distribution_reach'
  | 'sku_count';

export interface MetricConfig {
  key: ChartMetric;
  label: string;
  shortLabel: string;
  domain: [number, number];
  unit?: string;
  /** Data accessor path (for ChartPoint mapping) */
  accessor: string;
}

/**
 * Configuration for all available metrics.
 * Domain defines the min/max values for axis scaling.
 */
export const METRIC_CONFIGS: Record<ChartMetric, MetricConfig> = {
  price_score: {
    key: 'price_score',
    label: 'Price Score',
    shortLabel: 'Price',
    domain: [1, 10],
    accessor: 'x',
  },
  quality_score: {
    key: 'quality_score',
    label: 'Quality Score',
    shortLabel: 'Quality',
    domain: [1, 10],
    accessor: 'y',
  },
  market_share: {
    key: 'market_share',
    label: 'Market Share',
    shortLabel: 'Share',
    domain: [0, 100],
    unit: '%',
    accessor: 'marketSharePercent',
  },
  distribution_reach: {
    key: 'distribution_reach',
    label: 'Distribution Reach',
    shortLabel: 'Reach',
    domain: [0, 100],
    unit: '%',
    accessor: 'distributionReach',
  },
  sku_count: {
    key: 'sku_count',
    label: 'SKU Count',
    shortLabel: 'SKUs',
    domain: [0, 100], // Auto-scaled in practice
    accessor: 'skuCount',
  },
};

/**
 * Preset view configurations for quick access.
 */
export interface ViewPreset {
  id: string;
  name: string;
  description: string;
  xMetric: ChartMetric;
  yMetric: ChartMetric;
  icon: React.ReactNode;
}

export const VIEW_PRESETS: ViewPreset[] = [
  {
    id: 'position',
    name: 'Position',
    description: 'Classic price vs quality positioning',
    xMetric: 'price_score',
    yMetric: 'quality_score',
    icon: <Grid3X3 className="h-3.5 w-3.5" />,
  },
  {
    id: 'distribution',
    name: 'Distribution',
    description: 'Distribution reach vs market share',
    xMetric: 'distribution_reach',
    yMetric: 'market_share',
    icon: <Map className="h-3.5 w-3.5" />,
  },
  {
    id: 'reach',
    name: 'Reach',
    description: 'Price vs distribution reach',
    xMetric: 'price_score',
    yMetric: 'distribution_reach',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Quality vs SKU count',
    xMetric: 'quality_score',
    yMetric: 'sku_count',
    icon: <Layers className="h-3.5 w-3.5" />,
  },
];

export interface ChartAxisConfig {
  xMetric: ChartMetric;
  yMetric: ChartMetric;
}

interface ChartAxisSelectorProps {
  /** Current axis configuration */
  value: ChartAxisConfig;
  /** Callback when axis configuration changes */
  onChange: (config: ChartAxisConfig) => void;
  /** Whether to show compact view (preset buttons only) */
  compact?: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
}

/**
 * ChartAxisSelector Component
 *
 * Provides controls for changing chart axes:
 * - Preset buttons for common views (always visible)
 * - Custom axis selectors (shown in expanded mode)
 */
export function ChartAxisSelector({
  value,
  onChange,
  compact = true,
  disabled = false,
}: ChartAxisSelectorProps) {
  // Determine active preset (if any)
  const activePreset = useMemo(() => {
    return VIEW_PRESETS.find(
      (preset) => preset.xMetric === value.xMetric && preset.yMetric === value.yMetric
    );
  }, [value]);

  // Handle preset selection
  const handlePresetClick = (preset: ViewPreset) => {
    if (disabled) return;
    onChange({ xMetric: preset.xMetric, yMetric: preset.yMetric });
  };

  // Handle individual axis change
  const handleXAxisChange = (metric: ChartMetric) => {
    if (disabled) return;
    // Prevent same metric on both axes
    if (metric === value.yMetric) {
      // Swap axes
      onChange({ xMetric: metric, yMetric: value.xMetric });
    } else {
      onChange({ ...value, xMetric: metric });
    }
  };

  const handleYAxisChange = (metric: ChartMetric) => {
    if (disabled) return;
    // Prevent same metric on both axes
    if (metric === value.xMetric) {
      // Swap axes
      onChange({ xMetric: value.yMetric, yMetric: metric });
    } else {
      onChange({ ...value, yMetric: metric });
    }
  };

  return (
    <div
      data-testid="chart-axis-selector"
      className="flex flex-col gap-3"
    >
      {/* Preset View Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">View:</span>
        {VIEW_PRESETS.map((preset) => {
          const isActive = activePreset?.id === preset.id;
          return (
            <Tooltip key={preset.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-2 text-xs gap-1.5 ${
                    isActive ? 'bg-primary/10 text-primary border border-primary/20' : ''
                  }`}
                  onClick={() => handlePresetClick(preset)}
                  disabled={disabled}
                  data-testid={`preset-${preset.id}`}
                >
                  {preset.icon}
                  <span className="hidden sm:inline">{preset.name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-medium">{preset.name}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Custom indicator when not matching a preset */}
        {!activePreset && (
          <span className="text-xs text-muted-foreground ml-1">
            (Custom)
          </span>
        )}
      </div>

      {/* Custom Axis Selectors (shown when not compact) */}
      {!compact && (
        <div className="flex items-center gap-4 flex-wrap">
          {/* X-Axis Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">X:</label>
            <Select
              value={value.xMetric}
              onValueChange={(v) => handleXAxisChange(v as ChartMetric)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="x-axis-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(METRIC_CONFIGS).map((config) => (
                  <SelectItem key={config.key} value={config.key} className="text-xs">
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Y-Axis Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Y:</label>
            <Select
              value={value.yMetric}
              onValueChange={(v) => handleYAxisChange(v as ChartMetric)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="y-axis-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(METRIC_CONFIGS).map((config) => (
                  <SelectItem key={config.key} value={config.key} className="text-xs">
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle for full/compact mode indicator */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs ml-auto"
            onClick={() => {
              // Reset to default preset
              onChange({ xMetric: 'price_score', yMetric: 'quality_score' });
            }}
            disabled={disabled || (value.xMetric === 'price_score' && value.yMetric === 'quality_score')}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Default axis configuration (Position view)
 */
export const DEFAULT_AXIS_CONFIG: ChartAxisConfig = {
  xMetric: 'price_score',
  yMetric: 'quality_score',
};
