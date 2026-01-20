/**
 * VisualizationPageClient Component Tests
 *
 * Integration tests for the visualization page client component.
 * Story 17.3: Tests showBreadcrumb prop integration with MiBreadcrumb.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VisualizationPageClient } from './VisualizationPageClient';

// Mock auth hook
vi.mock('@/hooks/auth', () => ({
  useProfile: vi.fn(() => ({
    data: { role: 'viewer' },
    isLoading: false,
    error: null,
  })),
}));

// Mock competitor hooks
vi.mock('@/hooks/competitors', () => ({
  useDeleteCompetitor: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useCompetitorData: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

// Mock visualization hooks
vi.mock('@/hooks/visualization/usePdfExport', () => ({
  usePdfExport: vi.fn(() => ({
    exportToPdf: vi.fn(),
  })),
}));

vi.mock('@/hooks/visualization/usePitchMode', () => ({
  usePitchMode: vi.fn(() => ({
    isPitchMode: false,
    enterPitchMode: vi.fn(),
    exitPitchMode: vi.fn(),
  })),
}));

// Mock pitchMode store
vi.mock('@/stores/pitchMode', () => ({
  usePitchModeStore: vi.fn((selector) => {
    const state = {
      registerPdfDownload: vi.fn(),
      unregisterPdfDownload: vi.fn(),
      setIsGeneratingPdf: vi.fn(),
    };
    return selector(state);
  }),
}));

// Mock visualization components (heavy components)
vi.mock('@/components/visualization', () => ({
  ScatterChart: () => <div data-testid="scatter-chart-mock">Chart</div>,
  AddCompetitorButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="add-competitor-btn" onClick={onClick}>Add</button>
  ),
  CompetitorDialog: () => null,
  DeleteCompetitorDialog: () => null,
  MarkKelPositionButton: () => null,
  KelPositionDialog: () => null,
  ChartLegend: () => <div data-testid="chart-legend-mock">Legend</div>,
  ScatterChartSkeleton: () => <div data-testid="scatter-chart-skeleton">Loading...</div>,
  EnterPitchModeButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="enter-pitch-mode-btn" onClick={onClick}>Pitch Mode</button>
  ),
  PdfExportContent: () => null,
  PitchCompetitorTable: () => null,
}));

// DO NOT mock MiBreadcrumb - we want to test actual integration
// vi.mock('@/components/market-intelligence') is intentionally NOT here

describe('VisualizationPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showBreadcrumb prop integration (Story 17.3)', () => {
    it('does not render breadcrumb when showBreadcrumb is false (default)', () => {
      render(<VisualizationPageClient />);

      expect(screen.queryByTestId('mi-breadcrumb')).not.toBeInTheDocument();
    });

    it('does not render breadcrumb when showBreadcrumb is explicitly false', () => {
      render(<VisualizationPageClient showBreadcrumb={false} />);

      expect(screen.queryByTestId('mi-breadcrumb')).not.toBeInTheDocument();
    });

    it('renders MiBreadcrumb when showBreadcrumb is true', () => {
      render(<VisualizationPageClient showBreadcrumb />);

      expect(screen.getByTestId('mi-breadcrumb')).toBeInTheDocument();
    });

    it('renders breadcrumb with "Visualization" as current page', () => {
      render(<VisualizationPageClient showBreadcrumb />);

      // MiBreadcrumb should show "Visualization" as the current page
      expect(screen.getByText('Visualization')).toBeInTheDocument();
    });

    it('renders breadcrumb with link to Market Intelligence', () => {
      render(<VisualizationPageClient showBreadcrumb />);

      const link = screen.getByRole('link', { name: 'Market Intelligence' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/market-intelligence');
    });

    it('breadcrumb has proper accessibility label', () => {
      render(<VisualizationPageClient showBreadcrumb />);

      expect(
        screen.getByRole('navigation', { name: 'Breadcrumb' })
      ).toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('renders visualization page with correct test id', () => {
      render(<VisualizationPageClient />);

      expect(screen.getByTestId('visualization-page')).toBeInTheDocument();
    });

    it('renders page title', () => {
      render(<VisualizationPageClient />);

      expect(screen.getByText('Competitor Positioning')).toBeInTheDocument();
    });

    it('renders scatter chart', () => {
      render(<VisualizationPageClient />);

      expect(screen.getByTestId('scatter-chart-mock')).toBeInTheDocument();
    });

    it('renders chart legend', () => {
      render(<VisualizationPageClient />);

      expect(screen.getByTestId('chart-legend-mock')).toBeInTheDocument();
    });

    it('renders enter pitch mode button', () => {
      render(<VisualizationPageClient />);

      expect(screen.getByTestId('enter-pitch-mode-btn')).toBeInTheDocument();
    });
  });
});
