/**
 * PdfExportContent Component
 *
 * Print-optimized layout for PDF export of competitive analysis.
 * Designed for A4 paper (210 × 297mm) with 15mm margins.
 *
 * IMPORTANT: This component must be rendered off-screen (position: fixed; left: -9999px)
 * NOT display: none - html2canvas requires visible DOM elements to capture.
 *
 * @example
 * ```tsx
 * <div ref={pdfContentRef} className="fixed left-[-9999px] top-0" aria-hidden="true">
 *   <PdfExportContent competitors={competitors} kelPosition={kelPosition} />
 * </div>
 * ```
 */

'use client';

import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';

import type { CompetitorDataPoint } from '@/types';

interface PdfExportContentProps {
  /** Array of all competitor data points */
  competitors: CompetitorDataPoint[];
  /** Kel's target position, or null if not set */
  kelPosition: CompetitorDataPoint | null;
}

type Quadrant = 'premium' | 'value' | 'budget' | 'low-quality';

// Fixed chart dimensions for consistent PDF output
const CHART_WIDTH = 700;
const CHART_HEIGHT = 500;
const CHART_MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };

/**
 * Format date for display in PDF header
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate gap quadrants (0-1 data points = gap)
 */
function calculateGapQuadrants(data: Array<{ x: number; y: number }>): Quadrant[] {
  const quadrantCounts = {
    premium: data.filter((d) => d.x > 5 && d.y > 5).length,
    value: data.filter((d) => d.x <= 5 && d.y > 5).length,
    budget: data.filter((d) => d.x <= 5 && d.y <= 5).length,
    'low-quality': data.filter((d) => d.x > 5 && d.y <= 5).length,
  };

  return (Object.entries(quadrantCounts) as [Quadrant, number][])
    .filter(([, count]) => count <= 1)
    .map(([quadrant]) => quadrant);
}

export function PdfExportContent({ competitors, kelPosition }: PdfExportContentProps) {
  // Transform data for chart
  const chartData = competitors.map((c) => ({
    x: c.price_score,
    y: c.quality_score,
    name: c.name,
    id: c.id,
    isKel: c.is_kel_position ?? false,
  }));

  const kelData = chartData.filter((d) => d.isKel);
  const competitorData = chartData.filter((d) => !d.isKel);

  // Calculate statistics
  const totalCompetitors = competitorData.length;
  const gapQuadrants = calculateGapQuadrants(chartData);

  // IMPORTANT: Using inline styles with hex colors instead of Tailwind classes
  // because html2canvas doesn't support lab()/oklch() color functions used by Tailwind CSS v4.
  // Also using 'all: initial' to reset inherited CSS properties that might use lab() colors.
  return (
    <div
      data-testid="pdf-export-content"
      style={{
        all: 'initial', // Reset all inherited styles to avoid lab() colors from parent
        display: 'block',
        width: `${CHART_WIDTH + 40}px`, // Chart width + padding
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <header
        data-testid="pdf-header"
        style={{ marginBottom: '24px', textAlign: 'center' }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0,
          }}
        >
          Kel - Competitor Positioning
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            marginTop: '4px',
          }}
        >
          {formatDate(new Date())}
        </p>
      </header>

      {/* Chart Container - Fixed dimensions for consistent PDF output */}
      <div
        data-testid="pdf-chart-container"
        style={{
          width: CHART_WIDTH,
          height: CHART_HEIGHT,
          margin: '0 auto',
        }}
      >
        <RechartsScatter
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* Quadrant divider lines at 5,5 */}
          <ReferenceLine x={5} stroke="#9ca3af" strokeDasharray="3 3" />
          <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="3 3" />

          {/* Gap area indicators */}
          {gapQuadrants.includes('premium') && (
            <ReferenceArea
              x1={5}
              x2={10}
              y1={5}
              y2={10}
              fill="#f3f4f6"
              fillOpacity={0.5}
            />
          )}
          {gapQuadrants.includes('value') && (
            <ReferenceArea
              x1={1}
              x2={5}
              y1={5}
              y2={10}
              fill="#f3f4f6"
              fillOpacity={0.5}
            />
          )}
          {gapQuadrants.includes('budget') && (
            <ReferenceArea
              x1={1}
              x2={5}
              y1={1}
              y2={5}
              fill="#f3f4f6"
              fillOpacity={0.5}
            />
          )}
          {gapQuadrants.includes('low-quality') && (
            <ReferenceArea
              x1={5}
              x2={10}
              y1={1}
              y2={5}
              fill="#f3f4f6"
              fillOpacity={0.5}
            />
          )}

          <XAxis
            type="number"
            dataKey="x"
            domain={[1, 10]}
            name="Price"
            label={{
              value: 'Price (low → high)',
              position: 'bottom',
              offset: 20,
              fill: '#374151',
            }}
            tick={{ fill: '#374151' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[1, 10]}
            name="Quality"
            label={{
              value: 'Quality (low → high)',
              angle: -90,
              position: 'left',
              offset: 20,
              fill: '#374151',
            }}
            tick={{ fill: '#374151' }}
          />

          {/* Competitor data points */}
          <Scatter name="Competitors" data={competitorData} fill="#6b7280">
            {competitorData.map((entry) => (
              <Cell key={entry.id} fill="#6b7280" />
            ))}
          </Scatter>

          {/* Kel's target position - star marker */}
          {kelData.length > 0 && (
            <Scatter name="Kel Target" data={kelData} fill="#2563eb" shape="star">
              {kelData.map((entry) => (
                <Cell key={entry.id} fill="#2563eb" />
              ))}
            </Scatter>
          )}

          {/* Quadrant Labels */}
          <text
            x="82%"
            y="15%"
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={12}
          >
            Premium
          </text>
          <text
            x="18%"
            y="15%"
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={12}
          >
            Value
          </text>
          <text
            x="18%"
            y="85%"
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={12}
          >
            Budget
          </text>
          <text
            x="82%"
            y="85%"
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={12}
          >
            Low Quality
          </text>
        </RechartsScatter>
      </div>

      {/* Summary Stats Section */}
      <div
        data-testid="pdf-summary-stats"
        style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
          }}
        >
          <p
            style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
            }}
          >
            {totalCompetitors}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Competitors
          </p>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
          }}
        >
          <p
            style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
            }}
          >
            {kelPosition
              ? `(${kelPosition.price_score}, ${kelPosition.quality_score})`
              : 'Not Set'}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Kel Position
          </p>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
          }}
        >
          <p
            style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
            }}
          >
            {gapQuadrants.length}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Gap Quadrants
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer
        data-testid="pdf-footer"
        style={{
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          Confidential - Kel Snacks Philippines
        </p>
      </footer>
    </div>
  );
}
