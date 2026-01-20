import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CategoryFilterChips } from './CategoryFilterChips';

// Mock counts
const mockCounts = {
  all: 10,
  market_gap: 3,
  product_opportunity: 2,
  competitive_weakness: 4,
  trend_alignment: 1,
  // Status counts (not used by this component but part of the counts object)
  new: 5,
  reviewing: 2,
  actionable: 2,
  dismissed: 1,
};

describe('CategoryFilterChips', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all category options', () => {
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByText(/All/)).toBeInTheDocument();
      expect(screen.getByText(/Market Gap/)).toBeInTheDocument();
      expect(screen.getByText(/Product Opportunity/)).toBeInTheDocument();
      expect(screen.getByText(/Competitive Weakness/)).toBeInTheDocument();
      expect(screen.getByText(/Trend Alignment/)).toBeInTheDocument();
    });

    it('renders counts in parentheses', () => {
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByText(/\(10\)/)).toBeInTheDocument(); // All
      expect(screen.getByText(/\(3\)/)).toBeInTheDocument(); // Market Gap
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument(); // Product Opportunity
      expect(screen.getByText(/\(4\)/)).toBeInTheDocument(); // Competitive Weakness
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument(); // Trend Alignment
    });

    it('renders data-testid for testing', () => {
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('opportunity-category-filter-chips')).toBeInTheDocument();
    });

    it('renders individual filter testids', () => {
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('opportunity-category-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-category-filter-market_gap')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-category-filter-product_opportunity')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-category-filter-competitive_weakness')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-category-filter-trend_alignment')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('shows "all" as active when value is "all"', () => {
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      const allButton = screen.getByTestId('opportunity-category-filter-all');
      expect(allButton).toHaveAttribute('data-state', 'active');
    });

    it('shows correct category as active', () => {
      render(
        <CategoryFilterChips value="market_gap" counts={mockCounts} onChange={mockOnChange} />
      );

      const marketGapButton = screen.getByTestId('opportunity-category-filter-market_gap');
      expect(marketGapButton).toHaveAttribute('data-state', 'active');

      const allButton = screen.getByTestId('opportunity-category-filter-all');
      expect(allButton).toHaveAttribute('data-state', 'inactive');
    });
  });

  describe('interactions', () => {
    it('calls onChange when clicking a different category', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      await user.click(screen.getByTestId('opportunity-category-filter-market_gap'));

      expect(mockOnChange).toHaveBeenCalledWith('market_gap');
    });

    it('calls onChange when clicking "all" from another category', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFilterChips value="market_gap" counts={mockCounts} onChange={mockOnChange} />
      );

      await user.click(screen.getByTestId('opportunity-category-filter-all'));

      expect(mockOnChange).toHaveBeenCalledWith('all');
    });

    it('calls onChange for each category type', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      await user.click(screen.getByTestId('opportunity-category-filter-product_opportunity'));
      expect(mockOnChange).toHaveBeenCalledWith('product_opportunity');

      mockOnChange.mockClear();

      await user.click(screen.getByTestId('opportunity-category-filter-competitive_weakness'));
      expect(mockOnChange).toHaveBeenCalledWith('competitive_weakness');

      mockOnChange.mockClear();

      await user.click(screen.getByTestId('opportunity-category-filter-trend_alignment'));
      expect(mockOnChange).toHaveBeenCalledWith('trend_alignment');
    });
  });

  describe('accessibility', () => {
    it('has aria-label for filter group', () => {
      render(
        <CategoryFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveAttribute('aria-label', 'Filter opportunities by category');
    });
  });

  describe('zero counts', () => {
    it('renders correctly with zero counts', () => {
      const zeroCounts = {
        all: 0,
        market_gap: 0,
        product_opportunity: 0,
        competitive_weakness: 0,
        trend_alignment: 0,
        new: 0,
        reviewing: 0,
        actionable: 0,
        dismissed: 0,
      };

      render(
        <CategoryFilterChips value="all" counts={zeroCounts} onChange={mockOnChange} />
      );

      // Should still render all buttons with (0)
      expect(screen.getAllByText(/\(0\)/)).toHaveLength(5);
    });
  });
});
