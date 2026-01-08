import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StatusFilter } from './StatusFilter';

import type { StatusFilterKey } from '@/types/question';

describe('StatusFilter', () => {
  const defaultCounts: Record<StatusFilterKey, number> = {
    all: 10,
    draft: 3,
    sent: 4,
    decided: 3,
  };

  const defaultProps = {
    value: 'all' as StatusFilterKey,
    counts: defaultCounts,
    onChange: vi.fn(),
  };

  it('renders all filter tabs with counts', () => {
    render(<StatusFilter {...defaultProps} />);

    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    // Note: Both desktop (label) and mobile (shortLabel) spans render in jsdom
    // Desktop labels: All, Draft, Sent to Kel, Decided
    // Mobile labels: All, Dft, Sent, Dec
    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('All');
    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('(10)');
    expect(screen.getByTestId('status-filter-draft')).toHaveTextContent('Draft');
    expect(screen.getByTestId('status-filter-draft')).toHaveTextContent('Dft');
    expect(screen.getByTestId('status-filter-draft')).toHaveTextContent('(3)');
    expect(screen.getByTestId('status-filter-sent')).toHaveTextContent('Sent to Kel');
    expect(screen.getByTestId('status-filter-sent')).toHaveTextContent('(4)');
    expect(screen.getByTestId('status-filter-decided')).toHaveTextContent('Decided');
    expect(screen.getByTestId('status-filter-decided')).toHaveTextContent('Dec');
    expect(screen.getByTestId('status-filter-decided')).toHaveTextContent('(3)');
  });

  it('highlights the active filter tab', () => {
    render(<StatusFilter {...defaultProps} value="draft" />);

    const draftTab = screen.getByTestId('status-filter-draft');
    expect(draftTab).toHaveAttribute('data-state', 'active');
  });

  it('calls onChange when a different tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusFilter {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByTestId('status-filter-sent'));

    expect(onChange).toHaveBeenCalledWith('sent');
  });

  it('has proper accessibility attributes', () => {
    render(<StatusFilter {...defaultProps} />);

    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveAttribute('aria-label', 'Filter questions by status');
  });

  it('renders with 48px touch target height', () => {
    render(<StatusFilter {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab) => {
      expect(tab).toHaveClass('min-h-[48px]');
    });
  });

  it('updates counts dynamically', () => {
    const { rerender } = render(<StatusFilter {...defaultProps} />);

    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('(10)');

    const updatedCounts = { ...defaultCounts, all: 15, draft: 5 };
    rerender(<StatusFilter {...defaultProps} counts={updatedCounts} />);

    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('(15)');
    expect(screen.getByTestId('status-filter-draft')).toHaveTextContent('(5)');
  });

  it('renders responsive labels with desktop and mobile variants', () => {
    render(<StatusFilter {...defaultProps} />);

    // Verify desktop labels (hidden on mobile via sm:hidden class)
    const sentTab = screen.getByTestId('status-filter-sent');
    expect(sentTab).toHaveTextContent('Sent to Kel'); // Full desktop label
    expect(sentTab).toHaveTextContent('Sent'); // Abbreviated mobile label

    // Verify the responsive CSS classes are applied
    const desktopSpan = sentTab.querySelector('.hidden.sm\\:inline');
    const mobileSpan = sentTab.querySelector('.sm\\:hidden');
    expect(desktopSpan).toBeInTheDocument();
    expect(mobileSpan).toBeInTheDocument();
  });
});
