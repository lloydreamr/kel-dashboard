import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StatusFilterChips } from './StatusFilterChips';

// Mock counts
const mockCounts = {
  all: 10,
  market_gap: 3,
  product_opportunity: 2,
  competitive_weakness: 4,
  trend_alignment: 1,
  // Status counts
  new: 5,
  reviewing: 2,
  actionable: 2,
  dismissed: 1,
};

describe('StatusFilterChips', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all status options', () => {
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByText(/All/)).toBeInTheDocument();
      expect(screen.getByText(/New/)).toBeInTheDocument();
      expect(screen.getByText(/Reviewing/)).toBeInTheDocument();
      expect(screen.getByText(/Actionable/)).toBeInTheDocument();
      expect(screen.getByText(/Dismissed/)).toBeInTheDocument();
    });

    it('renders counts in parentheses', () => {
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByText(/\(10\)/)).toBeInTheDocument(); // All
      expect(screen.getByText(/\(5\)/)).toBeInTheDocument(); // New
      // Reviewing and Actionable both have (2), so use getAllByText
      expect(screen.getAllByText(/\(2\)/)).toHaveLength(2); // Reviewing + Actionable
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument(); // Dismissed
    });

    it('renders data-testid for testing', () => {
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('opportunity-status-filter-chips')).toBeInTheDocument();
    });

    it('renders individual filter testids', () => {
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('opportunity-status-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-status-filter-new')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-status-filter-reviewing')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-status-filter-actionable')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-status-filter-dismissed')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('shows "all" as active when value is "all"', () => {
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      const allButton = screen.getByTestId('opportunity-status-filter-all');
      expect(allButton).toHaveAttribute('data-state', 'active');
    });

    it('shows correct status as active', () => {
      render(
        <StatusFilterChips value="new" counts={mockCounts} onChange={mockOnChange} />
      );

      const newButton = screen.getByTestId('opportunity-status-filter-new');
      expect(newButton).toHaveAttribute('data-state', 'active');

      const allButton = screen.getByTestId('opportunity-status-filter-all');
      expect(allButton).toHaveAttribute('data-state', 'inactive');
    });

    it('shows reviewing as active', () => {
      render(
        <StatusFilterChips value="reviewing" counts={mockCounts} onChange={mockOnChange} />
      );

      const reviewingButton = screen.getByTestId('opportunity-status-filter-reviewing');
      expect(reviewingButton).toHaveAttribute('data-state', 'active');
    });

    it('shows actionable as active', () => {
      render(
        <StatusFilterChips value="actionable" counts={mockCounts} onChange={mockOnChange} />
      );

      const actionableButton = screen.getByTestId('opportunity-status-filter-actionable');
      expect(actionableButton).toHaveAttribute('data-state', 'active');
    });

    it('shows dismissed as active', () => {
      render(
        <StatusFilterChips value="dismissed" counts={mockCounts} onChange={mockOnChange} />
      );

      const dismissedButton = screen.getByTestId('opportunity-status-filter-dismissed');
      expect(dismissedButton).toHaveAttribute('data-state', 'active');
    });
  });

  describe('interactions', () => {
    it('calls onChange when clicking a different status', async () => {
      const user = userEvent.setup();
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      await user.click(screen.getByTestId('opportunity-status-filter-new'));

      expect(mockOnChange).toHaveBeenCalledWith('new');
    });

    it('calls onChange when clicking "all" from another status', async () => {
      const user = userEvent.setup();
      render(
        <StatusFilterChips value="new" counts={mockCounts} onChange={mockOnChange} />
      );

      await user.click(screen.getByTestId('opportunity-status-filter-all'));

      expect(mockOnChange).toHaveBeenCalledWith('all');
    });

    it('calls onChange for each status type', async () => {
      const user = userEvent.setup();
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      await user.click(screen.getByTestId('opportunity-status-filter-reviewing'));
      expect(mockOnChange).toHaveBeenCalledWith('reviewing');

      mockOnChange.mockClear();

      await user.click(screen.getByTestId('opportunity-status-filter-actionable'));
      expect(mockOnChange).toHaveBeenCalledWith('actionable');

      mockOnChange.mockClear();

      await user.click(screen.getByTestId('opportunity-status-filter-dismissed'));
      expect(mockOnChange).toHaveBeenCalledWith('dismissed');
    });
  });

  describe('accessibility', () => {
    it('has aria-label for filter group', () => {
      render(
        <StatusFilterChips value="all" counts={mockCounts} onChange={mockOnChange} />
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveAttribute('aria-label', 'Filter opportunities by status');
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
        <StatusFilterChips value="all" counts={zeroCounts} onChange={mockOnChange} />
      );

      // Should still render all buttons with (0)
      expect(screen.getAllByText(/\(0\)/)).toHaveLength(5);
    });
  });
});
