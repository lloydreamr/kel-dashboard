import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoryTabs } from './CategoryTabs';

import type { CategoryCounts, CategoryFilterKey } from '@/types/question';

describe('CategoryTabs', () => {
  const defaultCounts: CategoryCounts = {
    all: 100,
    market: 50,
    product: 30,
    distribution: 20,
  };

  const defaultProps = {
    value: 'all' as CategoryFilterKey,
    counts: defaultCounts,
    onChange: vi.fn(),
  };

  it('renders all category tabs with full labels and counts', () => {
    render(<CategoryTabs {...defaultProps} />);

    expect(screen.getByTestId('category-tabs')).toBeInTheDocument();
    // Full labels shown on all screen sizes (horizontal scroll on mobile)
    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('All Categories');
    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('(100)');
    expect(screen.getByTestId('category-tab-market')).toHaveTextContent('Market');
    expect(screen.getByTestId('category-tab-market')).toHaveTextContent('(50)');
    expect(screen.getByTestId('category-tab-product')).toHaveTextContent('Product');
    expect(screen.getByTestId('category-tab-product')).toHaveTextContent('(30)');
    expect(screen.getByTestId('category-tab-distribution')).toHaveTextContent('Distribution');
    expect(screen.getByTestId('category-tab-distribution')).toHaveTextContent('(20)');
  });

  it('highlights the active category tab', () => {
    render(<CategoryTabs {...defaultProps} value="market" />);

    const marketTab = screen.getByTestId('category-tab-market');
    expect(marketTab).toHaveAttribute('data-state', 'active');
  });

  it('calls onChange when a different tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryTabs {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByTestId('category-tab-distribution'));

    expect(onChange).toHaveBeenCalledWith('distribution');
  });

  it('has proper accessibility attributes', () => {
    render(<CategoryTabs {...defaultProps} />);

    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveAttribute('aria-label', 'Filter questions by category');
  });

  it('renders with 48px touch target height', () => {
    render(<CategoryTabs {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab) => {
      expect(tab).toHaveClass('min-h-12');
    });
  });

  it('updates counts dynamically', () => {
    const { rerender } = render(<CategoryTabs {...defaultProps} />);

    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('(100)');

    const updatedCounts = { ...defaultCounts, all: 150, market: 75 };
    rerender(<CategoryTabs {...defaultProps} counts={updatedCounts} />);

    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('(150)');
    expect(screen.getByTestId('category-tab-market')).toHaveTextContent('(75)');
  });

  it('renders mobile-friendly tabs with horizontal scroll capability', () => {
    render(<CategoryTabs {...defaultProps} />);

    // Verify full labels are shown (not abbreviated)
    const distributionTab = screen.getByTestId('category-tab-distribution');
    expect(distributionTab).toHaveTextContent('Distribution');

    // Verify tabs have whitespace-nowrap for horizontal scroll support
    expect(distributionTab).toHaveClass('whitespace-nowrap');

    // Verify tablist has overflow-x-auto for horizontal scrolling on mobile
    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveClass('overflow-x-auto');
  });
});
