'use client';

/**
 * PitchPdfExportContent Component
 *
 * Print-optimized layout for PDF export of pitch deck with AI summary.
 * Designed for A4 paper (210 × 297mm) with 15mm margins.
 *
 * IMPORTANT: This component must be rendered off-screen (position: fixed; left: -9999px)
 * NOT display: none - html2canvas requires visible DOM elements to capture.
 *
 * Story 18-3: Export with AI Summary
 *
 * @example
 * ```tsx
 * <div ref={pdfContentRef} className="fixed left-[-9999px] top-0" aria-hidden="true">
 *   <PitchPdfExportContent
 *     title="My Pitch"
 *     summary="Executive summary..."
 *     sections={[...]}
 *     competitorData={competitors}
 *     kelPosition={kelPosition}
 *   />
 * </div>
 * ```
 */

import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';

import type { CompetitorDataPoint } from '@/types';
import type { PitchSectionWithSources, PitchSectionType } from '@/types/pitch';
import { SECTION_TYPE_LABELS } from '@/types/pitch';

// ============================================================================
// Types
// ============================================================================

interface PitchPdfExportContentProps {
  /** Pitch title */
  title: string;
  /** AI-generated executive summary (2-3 sentences) */
  summary: string;
  /** Text sections to include in PDF */
  sections: PitchSectionWithSources[];
  /** Competitor data for scatter chart */
  competitorData?: CompetitorDataPoint[];
  /** Kel's target position */
  kelPosition?: CompetitorDataPoint | null;
  /** Market gaps data for display */
  marketGaps?: MarketGap[];
}

interface MarketGap {
  id: string;
  title: string;
  description: string;
  evidence?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Chart dimensions for PDF
const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;
const CHART_MARGIN = { top: 20, right: 20, bottom: 50, left: 50 };

// A4 dimensions in pixels (at 96 DPI)
const A4_WIDTH = 794; // 210mm
const A4_PADDING = 40;

// ============================================================================
// Helpers
// ============================================================================

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
 * Format section type to display label
 */
function getSectionLabel(sectionType: PitchSectionType): string {
  return SECTION_TYPE_LABELS[sectionType] || sectionType;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PDF export content with executive summary and all pitch sections.
 * Uses inline styles for html2canvas compatibility (no Tailwind lab() colors).
 */
export function PitchPdfExportContent({
  title,
  summary,
  sections,
  competitorData = [],
  kelPosition,
  marketGaps = [],
}: PitchPdfExportContentProps) {
  // Transform competitor data for chart
  const chartData = competitorData.map((c) => ({
    x: c.price_score,
    y: c.quality_score,
    name: c.name,
    id: c.id,
    isKel: c.is_kel_position ?? false,
  }));

  const kelData = chartData.filter((d) => d.isKel);
  const competitorChartData = chartData.filter((d) => !d.isKel);

  // Filter text sections (exclude dynamic data sections)
  const textSections = sections.filter(
    (s) =>
      s.section_type === 'market_opportunity' ||
      s.section_type === 'competitive_positioning' ||
      s.section_type === 'trend_alignment'
  );

  const hasCompetitorData = competitorData.length > 0;
  const hasMarketGaps = marketGaps.length > 0;

  return (
    <div
      data-testid="pitch-pdf-export-content"
      style={{
        all: 'initial',
        display: 'block',
        width: `${A4_WIDTH}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: `${A4_PADDING}px`,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <header
        data-testid="pitch-pdf-header"
        style={{ marginBottom: '24px', textAlign: 'center' }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            marginTop: '8px',
          }}
        >
          {formatDate(new Date())}
        </p>
      </header>

      {/* Executive Summary - Prominent box at top */}
      <div
        data-testid="pitch-pdf-summary"
        style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f0f9ff', // light blue
          border: '2px solid #0ea5e9', // blue border
          borderRadius: '8px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#0369a1', // dark blue
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Executive Summary
        </h2>
        <p
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#1e3a5f',
            margin: 0,
          }}
        >
          {summary}
        </p>
      </div>

      {/* Text Sections */}
      {textSections.map((section) => (
        <div
          key={section.id}
          data-testid={`pitch-pdf-section-${section.section_type}`}
          style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 12px 0',
            }}
          >
            {getSectionLabel(section.section_type as PitchSectionType)}
          </h3>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.7',
              color: '#374151',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {section.content}
          </p>
        </div>
      ))}

      {/* Competitive Landscape Chart */}
      {hasCompetitorData && (
        <div
          data-testid="pitch-pdf-competitive-landscape"
          style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0',
            }}
          >
            Competitive Landscape
          </h3>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <RechartsScatter
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              margin={CHART_MARGIN}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <ReferenceLine x={5} stroke="#9ca3af" strokeDasharray="3 3" />
              <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="3 3" />

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
                  offset: 10,
                  fill: '#374151',
                }}
                tick={{ fill: '#374151' }}
              />

              {/* Competitor points */}
              <Scatter name="Competitors" data={competitorChartData} fill="#6b7280">
                {competitorChartData.map((entry) => (
                  <Cell key={entry.id} fill="#6b7280" />
                ))}
              </Scatter>

              {/* Kel position - highlighted */}
              {kelData.length > 0 && (
                <Scatter name="Kel Target" data={kelData} fill="#2563eb" shape="star">
                  {kelData.map((entry) => (
                    <Cell key={entry.id} fill="#2563eb" />
                  ))}
                </Scatter>
              )}

              {/* Quadrant labels */}
              <text x="82%" y="15%" textAnchor="middle" fill="#9ca3af" fontSize={12}>
                Premium
              </text>
              <text x="18%" y="15%" textAnchor="middle" fill="#9ca3af" fontSize={12}>
                Value
              </text>
              <text x="18%" y="85%" textAnchor="middle" fill="#9ca3af" fontSize={12}>
                Budget
              </text>
              <text x="82%" y="85%" textAnchor="middle" fill="#9ca3af" fontSize={12}>
                Low Quality
              </text>
            </RechartsScatter>
          </div>

          {/* Statistics row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
              }}
            >
              <p
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0,
                }}
              >
                {competitorChartData.length}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                Competitors
              </p>
            </div>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
              }}
            >
              <p
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#2563eb',
                  margin: 0,
                }}
              >
                {kelPosition
                  ? `(${kelPosition.price_score}, ${kelPosition.quality_score})`
                  : 'N/A'}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                Kel Position
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market Gaps Section */}
      {hasMarketGaps && (
        <div
          data-testid="pitch-pdf-market-gaps"
          style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0',
            }}
          >
            Market Opportunities
          </h3>

          <div
            style={{
              display: 'grid',
              gap: '12px',
            }}
          >
            {marketGaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 8px 0',
                  }}
                >
                  {gap.title}
                </h4>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#374151',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  {gap.description}
                </p>
                {gap.evidence && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontStyle: 'italic',
                      marginTop: '8px',
                    }}
                  >
                    Evidence: {gap.evidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        data-testid="pitch-pdf-footer"
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
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
          Generated: {new Date().toISOString()}
        </p>
      </footer>
    </div>
  );
}
