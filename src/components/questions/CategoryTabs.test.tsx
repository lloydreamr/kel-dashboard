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

  it('renders all category tabs with counts', () => {
    render(<CategoryTabs {...defaultProps} />);

    expect(screen.getByTestId('category-tabs')).toBeInTheDocument();
    // Note: Both desktop (label) and mobile (shortLabel) spans render in jsdom
    // Desktop labels: All Categories, Market, Product, Distribution
    // Mobile labels: All, Mkt, Prod, Dist
    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('All Categories');
    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('All');
    expect(screen.getByTestId('category-tab-all')).toHaveTextContent('(100)');
    expect(screen.getByTestId('category-tab-market')).toHaveTextContent('Market');
    expect(screen.getByTestId('category-tab-market')).toHaveTextContent('Mkt');
    expect(screen.getByTestId('category-tab-market')).toHaveTextContent('(50)');
    expect(screen.getByTestId('category-tab-product')).toHaveTextContent('Product');
    expect(screen.getByTestId('category-tab-product')).toHaveTextContent('Prod');
    expect(screen.getByTestId('category-tab-product')).toHaveTextContent('(30)');
    expect(screen.getByTestId('category-tab-distribution')).toHaveTextContent('Distribution');
    expect(screen.getByTestId('category-tab-distribution')).toHaveTextContent('Dist');
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
      expect(tab).toHaveClass('min-h-[48px]');
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

  it('renders responsive labels with desktop and mobile variants', () => {
    render(<CategoryTabs {...defaultProps} />);

    // Verify desktop labels (hidden on mobile via sm:hidden class)
    const distributionTab = screen.getByTestId('category-tab-distribution');
    expect(distributionTab).toHaveTextContent('Distribution'); // Full desktop label
    expect(distributionTab).toHaveTextContent('Dist'); // Abbreviated mobile label

    // Verify the responsive CSS classes are applied
    const desktopSpan = distributionTab.querySelector('.hidden.sm\\:inline');
    const mobileSpan = distributionTab.querySelector('.sm\\:hidden');
    expect(desktopSpan).toBeInTheDocument();
    expect(mobileSpan).toBeInTheDocument();
  });
});
