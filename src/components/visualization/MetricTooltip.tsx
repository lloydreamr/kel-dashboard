'use client';

import { InfoIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { METRIC_GLOSSARY, type MetricKey } from '@/lib/constants/glossary';

interface MetricTooltipProps {
  metricKey: MetricKey;
  children: React.ReactNode;
}

/**
 * MetricTooltip - Wraps children with an explanatory tooltip for metrics.
 *
 * Displays the metric definition, scale, and "good value" guidance on hover.
 * Used in PitchCompetitorTable to help explain metrics during distributor presentations.
 *
 * @example
 * ```tsx
 * <MetricTooltip metricKey="qualityScore">
 *   Quality Score
 * </MetricTooltip>
 * ```
 */
export function MetricTooltip({ metricKey, children }: MetricTooltipProps) {
  const metric = METRIC_GLOSSARY[metricKey];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50"
          data-testid={metric.testId}
          tabIndex={0}
        >
          {children}
          <InfoIcon className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        data-testid="tooltip-content"
        className="max-w-xs"
        side="top"
      >
        <div className="space-y-1">
          <p className="font-medium">{metric.label}</p>
          <p className="text-xs">{metric.definition}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Scale:</span> {metric.scale}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Good:</span> {metric.goodValue}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
