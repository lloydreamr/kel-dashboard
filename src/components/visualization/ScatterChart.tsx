'use client';

import { useState } from 'react';
import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

import { ScatterChartSkeleton } from '@/components/visualization/ScatterChartSkeleton';
import { CompetitorEditPopover } from '@/components/visualization/CompetitorEditPopover';
import { useCompetitorData } from '@/hooks/competitors';

import type { CompetitorDataPoint } from '@/types';

interface ChartPoint {
  x: number;
  y: number;
  name: string;
  id: string;
  isKel: boolean;
}

interface ScatterChartProps {
  isMaho: boolean;
  onEditClick: (competitor: CompetitorDataPoint) => void;
  onDeleteClick: (competitor: CompetitorDataPoint) => void;
}

export function ScatterChart({ isMaho, onEditClick, onDeleteClick }: ScatterChartProps) {
  const { data: competitors, isLoading, error, refetch } = useCompetitorData();
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);

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

  // Empty state - no data yet
  if (!competitors || competitors.length === 0) {
    return (
      <div
        data-testid="scatter-chart-empty"
        className="w-full h-[400px] flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No competitor data yet</p>
          <p className="text-sm text-muted-foreground">
            Add competitors to see the positioning chart
          </p>
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
  }));

  const kelPosition = chartData.filter((d) => d.isKel);
  const competitorData = chartData.filter((d) => !d.isKel);

  return (
    <div data-testid="scatter-chart" className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatter margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* Quadrant divider lines */}
          <ReferenceLine
            x={5.5}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            opacity={0.5}
            data-testid="chart-quadrant-line-vertical"
          />
          <ReferenceLine
            y={5.5}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            opacity={0.5}
            data-testid="chart-quadrant-line-horizontal"
          />

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
              if (active && payload && payload.length) {
                const data = payload[0].payload as ChartPoint;
                return (
                  <div className="bg-popover border rounded-md p-2 shadow-md">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Price: {data.x} | Quality: {data.y}
                    </p>
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
            {competitorData.map((entry) => (
              <Cell key={entry.id} data-testid="chart-data-point" />
            ))}
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

      {/* Edit popover for clicked data points */}
      {selectedCompetitor && popoverAnchor && (
        <CompetitorEditPopover
          competitor={selectedCompetitor}
          open={!!selectedCompetitor}
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
