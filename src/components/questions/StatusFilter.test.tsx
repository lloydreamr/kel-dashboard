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
    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('All (10)');
    expect(screen.getByTestId('status-filter-draft')).toHaveTextContent('Draft (3)');
    expect(screen.getByTestId('status-filter-sent')).toHaveTextContent('Sent to Kel (4)');
    expect(screen.getByTestId('status-filter-decided')).toHaveTextContent('Decided (3)');
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

    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('All (10)');

    const updatedCounts = { ...defaultCounts, all: 15, draft: 5 };
    rerender(<StatusFilter {...defaultProps} counts={updatedCounts} />);

    expect(screen.getByTestId('status-filter-all')).toHaveTextContent('All (15)');
    expect(screen.getByTestId('status-filter-draft')).toHaveTextContent('Draft (5)');
  });
});
