/**
 * PdfExportContent Component Tests
 *
 * Unit tests for the PDF export layout component.
 * Story 11.2: PDF One-Pager Export (Task 3)
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PdfExportContent } from './PdfExportContent';

import type { CompetitorDataPoint } from '@/types';

// Mock Recharts components since they don't render in JSDOM
vi.mock('recharts', () => ({
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-scatter">{children}</div>
  ),
  Scatter: () => <div data-testid="recharts-scatter-data" />,
  XAxis: () => <div data-testid="recharts-xaxis" />,
  YAxis: () => <div data-testid="recharts-yaxis" />,
  CartesianGrid: () => <div data-testid="recharts-grid" />,
  ReferenceLine: () => <div data-testid="recharts-reference-line" />,
  ReferenceArea: () => <div data-testid="recharts-reference-area" />,
  Cell: () => <div data-testid="recharts-cell" />,
}));

// Factory for creating test competitor data
function createCompetitor(overrides: Partial<CompetitorDataPoint> = {}): CompetitorDataPoint {
  return {
    id: `competitor-${Math.random().toString(36).substring(7)}`,
    name: 'Test Competitor',
    price_score: 5,
    quality_score: 5,
    category: 'chips',
    notes: null,
    is_kel_position: false,
    created_by: 'user-123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PdfExportContent', () => {
  const defaultProps = {
    competitors: [
      createCompetitor({ name: 'Oishi', price_score: 4, quality_score: 6 }),
      createCompetitor({ name: 'Jack n Jill', price_score: 5, quality_score: 5 }),
    ],
    kelPosition: createCompetitor({
      name: "Kel's Target Position",
      price_score: 7,
      quality_score: 8,
      is_kel_position: true,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('header section', () => {
    it('renders header with title', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert
      expect(screen.getByText('Kel - Competitor Positioning')).toBeInTheDocument();
    });

    it('renders current date in header', () => {
      // Arrange
      const mockDate = new Date('2026-01-07');
      vi.setSystemTime(mockDate);

      // Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - should show formatted date
      expect(screen.getByText(/January 7, 2026/)).toBeInTheDocument();

      // Cleanup
      vi.useRealTimers();
    });
  });

  describe('chart section', () => {
    it('renders chart container with fixed dimensions', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - chart container should exist
      const chartContainer = screen.getByTestId('pdf-chart-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('renders recharts scatter chart', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - mocked recharts should render
      expect(screen.getByTestId('recharts-scatter')).toBeInTheDocument();
    });
  });

  describe('summary stats section', () => {
    it('displays total competitors count', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - 2 competitors (excluding Kel position)
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Competitors')).toBeInTheDocument();
    });

    it('displays Kel position coordinates when present', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - shows Kel position (7, 8)
      expect(screen.getByText('(7, 8)')).toBeInTheDocument();
      expect(screen.getByText('Kel Position')).toBeInTheDocument();
    });

    it('displays "Not Set" when Kel position is null', () => {
      // Arrange
      const propsWithoutKel = {
        ...defaultProps,
        kelPosition: null,
      };

      // Act
      render(<PdfExportContent {...propsWithoutKel} />);

      // Assert
      expect(screen.getByText('Not Set')).toBeInTheDocument();
    });

    it('displays gap quadrants count', () => {
      // Arrange - with only 2 competitors in value quadrant, other quadrants are gaps
      const propsWithGaps = {
        competitors: [
          createCompetitor({ price_score: 3, quality_score: 7 }), // value
          createCompetitor({ price_score: 4, quality_score: 8 }), // value
        ],
        kelPosition: null,
      };

      // Act
      render(<PdfExportContent {...propsWithGaps} />);

      // Assert - 3 gap quadrants (premium, budget, low-quality have 0 points)
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Gap Quadrants')).toBeInTheDocument();
    });
  });

  describe('footer section', () => {
    it('renders confidential footer', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert
      expect(screen.getByText('Confidential - Kel Snacks Philippines')).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('renders all sections in correct order', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - sections should be present
      expect(screen.getByTestId('pdf-export-content')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-header')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-chart-container')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-summary-stats')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-footer')).toBeInTheDocument();
    });

    it('has proper A4-friendly container styling', () => {
      // Arrange & Act
      render(<PdfExportContent {...defaultProps} />);

      // Assert - container should have white background for PDF
      // Note: Uses inline styles instead of Tailwind classes because
      // html2canvas doesn't support lab()/oklch() color functions
      const container = screen.getByTestId('pdf-export-content');
      expect(container).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });
  });

  describe('quadrant calculation', () => {
    it('identifies premium quadrant gap (high price, high quality)', () => {
      // Arrange - 2+ competitors in budget quadrant, 0-1 in others
      // A quadrant is a "gap" when it has ≤1 points
      const props = {
        competitors: [
          createCompetitor({ price_score: 3, quality_score: 3 }), // budget
          createCompetitor({ price_score: 4, quality_score: 4 }), // budget
        ],
        kelPosition: null,
      };

      // Act
      render(<PdfExportContent {...props} />);

      // Assert - premium, value, and low-quality are gaps (3 gaps)
      // Budget has 2 competitors so it's NOT a gap
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('counts filled quadrants correctly', () => {
      // Arrange - competitors in all 4 quadrants with 2+ each
      const props = {
        competitors: [
          createCompetitor({ price_score: 7, quality_score: 7 }), // premium
          createCompetitor({ price_score: 8, quality_score: 8 }), // premium
          createCompetitor({ price_score: 3, quality_score: 7 }), // value
          createCompetitor({ price_score: 4, quality_score: 8 }), // value
          createCompetitor({ price_score: 3, quality_score: 3 }), // budget
          createCompetitor({ price_score: 4, quality_score: 4 }), // budget
          createCompetitor({ price_score: 7, quality_score: 3 }), // low-quality
          createCompetitor({ price_score: 8, quality_score: 4 }), // low-quality
        ],
        kelPosition: null,
      };

      // Act
      render(<PdfExportContent {...props} />);

      // Assert - 0 gap quadrants (all have 2+ points)
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('empty state handling', () => {
    it('handles empty competitors array gracefully', () => {
      // Arrange
      const props = {
        competitors: [],
        kelPosition: null,
      };

      // Act
      render(<PdfExportContent {...props} />);

      // Assert - should still render structure
      expect(screen.getByTestId('pdf-export-content')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // 0 competitors
    });
  });
});
