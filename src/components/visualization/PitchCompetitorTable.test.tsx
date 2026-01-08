/**
 * PitchCompetitorTable Component Tests
 *
 * Tests for the pitch mode competitor comparison table including:
 * - Rendering all competitor rows with correct columns
 * - Kel row highlighting when position provided
 * - No Kel row when kelPosition is null
 * - No edit/delete buttons (read-only view)
 * - Price range label mapping (budget, mid-range, premium)
 * - Market position label mapping (premium, value, budget, low quality)
 * - Metric tooltips for column headers (Story 11.5)
 *
 * Story 11.4: Clean Competitor Comparison View
 * Story 11.5: Glossary Tooltips for Metrics
 */

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';
import { createMockCompetitor, createMockKelPosition } from '@/test/factories';

import {
  PitchCompetitorTable,
  getPriceRangeLabel,
  getMarketPosition,
} from './PitchCompetitorTable';

/**
 * Render helper that wraps component with TooltipProvider.
 * Required for MetricTooltip components in table headers.
 */
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

describe('PitchCompetitorTable', () => {
  // AC#1: Clean table shows Name, Price Range, Quality Score, Market Position
  describe('Table rendering', () => {
    it('renders table with correct column headers', () => {
      // Arrange
      const competitors = [createMockCompetitor({ name: 'Oishi' })];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert - Name doesn't have tooltip, but others have tooltip wrappers
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      // For tooltip-wrapped headers, check by text content
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Quality Score')).toBeInTheDocument();
      expect(screen.getByText('Market Position')).toBeInTheDocument();
    });

    it('renders all competitor rows with correct data', () => {
      // Arrange
      const competitors = [
        createMockCompetitor({ name: 'Oishi', price_score: 4, quality_score: 6 }),
        createMockCompetitor({ name: 'Jack n Jill', price_score: 3, quality_score: 5 }),
      ];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert - row count (2 data rows)
      const rows = screen.getAllByRole('row');
      // 1 header row + 2 data rows = 3 total
      expect(rows).toHaveLength(3);

      // Assert - competitor names present
      expect(screen.getByText('Oishi')).toBeInTheDocument();
      expect(screen.getByText('Jack n Jill')).toBeInTheDocument();
    });

    it('renders quality score with /10 suffix', () => {
      // Arrange
      const competitors = [
        createMockCompetitor({ name: 'Test', quality_score: 7 }),
      ];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert
      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('has data-testid for E2E testing', () => {
      // Arrange
      const competitors = [createMockCompetitor()];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert
      expect(screen.getByTestId('pitch-competitor-table')).toBeInTheDocument();
    });

    it('returns null when no competitors and no kelPosition', () => {
      // Arrange & Act
      const { container } = renderWithTooltip(
        <PitchCompetitorTable competitors={[]} kelPosition={null} />
      );

      // Assert - TooltipProvider is still there, but table returns null
      expect(container.querySelector('[data-testid="pitch-competitor-table"]')).toBeNull();
    });
  });

  // AC#2: Kel row highlighted with different background color
  describe('Kel row highlighting', () => {
    it('renders Kel row with highlight when kelPosition provided', () => {
      // Arrange
      const kelPosition = createMockKelPosition({ name: 'Kel' });
      const competitors = [createMockCompetitor({ name: 'Oishi' })];

      // Act
      renderWithTooltip(
        <PitchCompetitorTable competitors={competitors} kelPosition={kelPosition} />
      );

      // Assert
      const kelRow = screen.getByTestId('pitch-kel-row-highlight');
      expect(kelRow).toBeInTheDocument();
      expect(kelRow).toHaveClass('bg-primary/10');
    });

    it('places Kel row first in the table', () => {
      // Arrange
      const kelPosition = createMockKelPosition({ name: 'Kel' });
      const competitors = [
        createMockCompetitor({ name: 'Oishi' }),
        createMockCompetitor({ name: 'Jack n Jill' }),
      ];

      // Act
      renderWithTooltip(
        <PitchCompetitorTable competitors={competitors} kelPosition={kelPosition} />
      );

      // Assert - Kel should be first data row
      const rows = screen.getAllByRole('row');
      // rows[0] is header, rows[1] is first data row
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Kel')).toBeInTheDocument();
    });

    it('does not render Kel row when kelPosition is null', () => {
      // Arrange
      const competitors = [createMockCompetitor({ name: 'Oishi' })];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert
      expect(screen.queryByTestId('pitch-kel-row-highlight')).not.toBeInTheDocument();
    });

    it('filters duplicate Kel entries from competitors array', () => {
      // Arrange - competitors array includes a Kel position (shouldn't duplicate)
      const kelPosition = createMockKelPosition({ id: 'kel-id', name: 'Kel' });
      const competitors = [
        createMockCompetitor({ name: 'Oishi' }),
        createMockCompetitor({ id: 'kel-id', name: 'Kel', is_kel_position: true }),
      ];

      // Act
      renderWithTooltip(
        <PitchCompetitorTable competitors={competitors} kelPosition={kelPosition} />
      );

      // Assert - only 3 rows total (header + Kel + Oishi, NOT header + Kel + Oishi + Kel)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3);
    });
  });

  // AC#3: No edit buttons appear in the table
  describe('Read-only view', () => {
    it('does not render any buttons in table', () => {
      // Arrange
      const competitors = [
        createMockCompetitor({ name: 'Oishi' }),
        createMockCompetitor({ name: 'Jack n Jill' }),
      ];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('does not render any links in table cells', () => {
      // Arrange
      const competitors = [createMockCompetitor({ name: 'Oishi' })];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert - no clickable elements in table body
      const table = screen.getByTestId('pitch-competitor-table');
      const links = within(table).queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  // Story 11.5: Glossary Tooltips for Metrics
  describe('Metric tooltips', () => {
    it('renders tooltip triggers for metric column headers', () => {
      // Arrange
      const competitors = [createMockCompetitor({ name: 'Oishi' })];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert - check for tooltip trigger test IDs
      expect(screen.getByTestId('tooltip-price-range')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-quality-score')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-market-position')).toBeInTheDocument();
    });

    it('renders info icons for hoverable headers', () => {
      // Arrange
      const competitors = [createMockCompetitor({ name: 'Oishi' })];

      // Act
      renderWithTooltip(<PitchCompetitorTable competitors={competitors} kelPosition={null} />);

      // Assert - each tooltip trigger should have an SVG icon
      const tooltipTriggers = [
        screen.getByTestId('tooltip-price-range'),
        screen.getByTestId('tooltip-quality-score'),
        screen.getByTestId('tooltip-market-position'),
      ];

      tooltipTriggers.forEach((trigger) => {
        expect(trigger.querySelector('svg')).toBeInTheDocument();
      });
    });
  });
});

// AC#1: Price range labels
describe('getPriceRangeLabel', () => {
  it('returns "Budget" for scores 1-3', () => {
    expect(getPriceRangeLabel(1)).toBe('Budget');
    expect(getPriceRangeLabel(2)).toBe('Budget');
    expect(getPriceRangeLabel(3)).toBe('Budget');
  });

  it('returns "Mid-Range" for scores 4-6', () => {
    expect(getPriceRangeLabel(4)).toBe('Mid-Range');
    expect(getPriceRangeLabel(5)).toBe('Mid-Range');
    expect(getPriceRangeLabel(6)).toBe('Mid-Range');
  });

  it('returns "Premium" for scores 7-10', () => {
    expect(getPriceRangeLabel(7)).toBe('Premium');
    expect(getPriceRangeLabel(8)).toBe('Premium');
    expect(getPriceRangeLabel(9)).toBe('Premium');
    expect(getPriceRangeLabel(10)).toBe('Premium');
  });
});

// AC#1: Market position labels (quadrant-based)
describe('getMarketPosition', () => {
  it('returns "Premium" for high price (>5) and high quality (>5)', () => {
    expect(getMarketPosition(6, 6)).toBe('Premium');
    expect(getMarketPosition(10, 10)).toBe('Premium');
    expect(getMarketPosition(8, 7)).toBe('Premium');
  });

  it('returns "Value" for low price (≤5) and high quality (>5)', () => {
    expect(getMarketPosition(5, 6)).toBe('Value');
    expect(getMarketPosition(3, 8)).toBe('Value');
    expect(getMarketPosition(1, 10)).toBe('Value');
  });

  it('returns "Budget" for low price (≤5) and low quality (≤5)', () => {
    expect(getMarketPosition(5, 5)).toBe('Budget');
    expect(getMarketPosition(3, 3)).toBe('Budget');
    expect(getMarketPosition(1, 1)).toBe('Budget');
  });

  it('returns "Low Quality" for high price (>5) and low quality (≤5)', () => {
    expect(getMarketPosition(6, 5)).toBe('Low Quality');
    expect(getMarketPosition(10, 2)).toBe('Low Quality');
    expect(getMarketPosition(8, 3)).toBe('Low Quality');
  });

  it('handles edge cases at boundary (5,5 is Budget, 6,6 is Premium)', () => {
    // At exactly 5,5 - both are NOT high (>5), so Budget
    expect(getMarketPosition(5, 5)).toBe('Budget');
    // At exactly 6,6 - both ARE high (>5), so Premium
    expect(getMarketPosition(6, 6)).toBe('Premium');
  });
});
