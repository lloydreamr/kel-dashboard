/**
 * Tests for PitchPdfExportContent Component
 *
 * Story 18-3: Export with AI Summary
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PitchPdfExportContent } from './PitchPdfExportContent';

import type { PitchSectionWithSources } from '@/types/pitch';
import type { CompetitorDataPoint } from '@/types';

// Mock Recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-scatter-chart">{children}</div>
  ),
  Scatter: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
}));

describe('PitchPdfExportContent', () => {
  const mockSections: PitchSectionWithSources[] = [
    {
      id: 'section-1',
      pitch_draft_id: 'draft-1',
      section_type: 'market_opportunity',
      content: 'The Philippine snack market is growing at 12% annually.',
      ai_generated: true,
      user_edited: false,
      confidence_score: 0.85,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      sources: [],
    },
    {
      id: 'section-2',
      pitch_draft_id: 'draft-1',
      section_type: 'competitive_positioning',
      content: 'Kel offers unique puffed corn technology.',
      ai_generated: true,
      user_edited: false,
      confidence_score: 0.9,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      sources: [],
    },
    {
      id: 'section-3',
      pitch_draft_id: 'draft-1',
      section_type: 'trend_alignment',
      content: 'Aligns with healthier snacking trends.',
      ai_generated: true,
      user_edited: false,
      confidence_score: 0.75,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      sources: [],
    },
  ];

  const mockCompetitors: CompetitorDataPoint[] = [
    {
      id: 'comp-1',
      name: 'Oishi',
      price_score: 6,
      quality_score: 7,
      is_kel_position: false,
    },
    {
      id: 'comp-2',
      name: 'Jack n Jill',
      price_score: 5,
      quality_score: 6,
      is_kel_position: false,
    },
  ];

  const mockKelPosition: CompetitorDataPoint = {
    id: 'kel-1',
    name: 'Kel',
    price_score: 4,
    quality_score: 8,
    is_kel_position: true,
  };

  it('renders the main container', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={[]}
      />
    );

    expect(screen.getByTestId('pitch-pdf-export-content')).toBeInTheDocument();
  });

  it('renders the pitch title', () => {
    render(
      <PitchPdfExportContent
        title="My Distributor Pitch"
        summary="Test summary"
        sections={[]}
      />
    );

    expect(screen.getByText('My Distributor Pitch')).toBeInTheDocument();
  });

  it('renders the executive summary prominently', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Philippine snack market offers 15% growth opportunity."
        sections={[]}
      />
    );

    expect(screen.getByTestId('pitch-pdf-summary')).toBeInTheDocument();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    expect(
      screen.getByText('Philippine snack market offers 15% growth opportunity.')
    ).toBeInTheDocument();
  });

  it('renders all text sections', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
      />
    );

    expect(
      screen.getByTestId('pitch-pdf-section-market_opportunity')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('pitch-pdf-section-competitive_positioning')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('pitch-pdf-section-trend_alignment')
    ).toBeInTheDocument();

    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Competitive Positioning')).toBeInTheDocument();
    expect(screen.getByText('Trend Alignment')).toBeInTheDocument();
  });

  it('renders section content', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
      />
    );

    expect(
      screen.getByText('The Philippine snack market is growing at 12% annually.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Kel offers unique puffed corn technology.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Aligns with healthier snacking trends.')
    ).toBeInTheDocument();
  });

  it('renders competitive landscape chart when data provided', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        competitorData={mockCompetitors}
        kelPosition={mockKelPosition}
      />
    );

    expect(
      screen.getByTestId('pitch-pdf-competitive-landscape')
    ).toBeInTheDocument();
    expect(screen.getByText('Competitive Landscape')).toBeInTheDocument();
    expect(screen.getByTestId('mock-scatter-chart')).toBeInTheDocument();
  });

  it('does not render competitive landscape when no data', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        competitorData={[]}
      />
    );

    expect(
      screen.queryByTestId('pitch-pdf-competitive-landscape')
    ).not.toBeInTheDocument();
  });

  it('displays competitor count in statistics', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        competitorData={mockCompetitors}
        kelPosition={mockKelPosition}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Competitors')).toBeInTheDocument();
  });

  it('displays Kel position in statistics', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        competitorData={mockCompetitors}
        kelPosition={mockKelPosition}
      />
    );

    expect(screen.getByText('(4, 8)')).toBeInTheDocument();
    expect(screen.getByText('Kel Position')).toBeInTheDocument();
  });

  it('shows N/A when no Kel position set', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        competitorData={mockCompetitors}
        kelPosition={null}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders market gaps when provided', () => {
    const marketGaps = [
      {
        id: 'gap-1',
        title: 'Premium Healthy Snacks',
        description: 'Underserved segment with high growth potential.',
        evidence: 'Market research 2025',
      },
      {
        id: 'gap-2',
        title: 'Value Protein Snacks',
        description: 'Growing demand for affordable protein options.',
      },
    ];

    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        marketGaps={marketGaps}
      />
    );

    expect(screen.getByTestId('pitch-pdf-market-gaps')).toBeInTheDocument();
    expect(screen.getByText('Market Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Premium Healthy Snacks')).toBeInTheDocument();
    expect(screen.getByText('Value Protein Snacks')).toBeInTheDocument();
    expect(
      screen.getByText('Underserved segment with high growth potential.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Evidence: Market research 2025/)).toBeInTheDocument();
  });

  it('does not render market gaps when empty', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={mockSections}
        marketGaps={[]}
      />
    );

    expect(screen.queryByTestId('pitch-pdf-market-gaps')).not.toBeInTheDocument();
  });

  it('renders the footer with confidentiality notice', () => {
    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={[]}
      />
    );

    expect(screen.getByTestId('pitch-pdf-footer')).toBeInTheDocument();
    expect(
      screen.getByText('Confidential - Kel Snacks Philippines')
    ).toBeInTheDocument();
  });

  it('filters out dynamic sections (competitive_landscape, market_gaps)', () => {
    const sectionsWithDynamic: PitchSectionWithSources[] = [
      ...mockSections,
      {
        id: 'section-dynamic-1',
        pitch_draft_id: 'draft-1',
        section_type: 'competitive_landscape',
        content: '{}',
        ai_generated: false,
        user_edited: false,
        confidence_score: null,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        sources: [],
      },
      {
        id: 'section-dynamic-2',
        pitch_draft_id: 'draft-1',
        section_type: 'market_gaps',
        content: '{}',
        ai_generated: false,
        user_edited: false,
        confidence_score: null,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        sources: [],
      },
    ];

    render(
      <PitchPdfExportContent
        title="Test Pitch"
        summary="Test summary"
        sections={sectionsWithDynamic}
      />
    );

    // Text sections should be rendered
    expect(
      screen.getByTestId('pitch-pdf-section-market_opportunity')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('pitch-pdf-section-competitive_positioning')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('pitch-pdf-section-trend_alignment')
    ).toBeInTheDocument();

    // Dynamic sections from sections array should NOT create section cards
    // (they are rendered separately via competitorData and marketGaps props)
    expect(
      screen.queryByTestId('pitch-pdf-section-competitive_landscape')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('pitch-pdf-section-market_gaps')
    ).not.toBeInTheDocument();
  });
});
