import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterEmptyState } from './FilterEmptyState';

describe('FilterEmptyState', () => {
  it('renders with the correct filter label', () => {
    render(<FilterEmptyState filter="draft" totalCount={5} />);

    expect(screen.getByTestId('filter-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no draft questions/i)).toBeInTheDocument();
  });

  it('shows "Show all" button when there are other questions and onShowAll provided', () => {
    const onShowAll = vi.fn();
    render(<FilterEmptyState filter="sent" totalCount={10} onShowAll={onShowAll} />);

    expect(screen.getByTestId('show-all-button')).toBeInTheDocument();
    expect(screen.getByText(/show all 10 questions/i)).toBeInTheDocument();
  });

  it('uses singular "question" in button when totalCount is 1', () => {
    const onShowAll = vi.fn();
    render(<FilterEmptyState filter="decided" totalCount={1} onShowAll={onShowAll} />);

    expect(screen.getByText(/show all 1 question$/i)).toBeInTheDocument();
  });

  it('does not show button when totalCount is 0', () => {
    const onShowAll = vi.fn();
    render(<FilterEmptyState filter="draft" totalCount={0} onShowAll={onShowAll} />);

    expect(screen.queryByTestId('show-all-button')).not.toBeInTheDocument();
  });

  it('does not show button when onShowAll is not provided', () => {
    render(<FilterEmptyState filter="draft" totalCount={5} />);

    expect(screen.queryByTestId('show-all-button')).not.toBeInTheDocument();
  });

  it('calls onShowAll when button is clicked', async () => {
    const user = userEvent.setup();
    const onShowAll = vi.fn();
    render(<FilterEmptyState filter="sent" totalCount={10} onShowAll={onShowAll} />);

    await user.click(screen.getByTestId('show-all-button'));

    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<FilterEmptyState filter="sent" totalCount={5} />);

    const element = screen.getByTestId('filter-empty-state');
    expect(element).toHaveAttribute('role', 'status');
    expect(element).toHaveAttribute('aria-label', 'No sent to kel questions');
  });

  it('renders correctly for each filter type', () => {
    const { rerender } = render(<FilterEmptyState filter="all" totalCount={0} />);
    expect(screen.getByText(/no all questions/i)).toBeInTheDocument();

    rerender(<FilterEmptyState filter="draft" totalCount={0} />);
    expect(screen.getByText(/no draft questions/i)).toBeInTheDocument();

    rerender(<FilterEmptyState filter="sent" totalCount={0} />);
    expect(screen.getByText(/no sent to kel questions/i)).toBeInTheDocument();

    rerender(<FilterEmptyState filter="decided" totalCount={0} />);
    expect(screen.getByText(/no decided questions/i)).toBeInTheDocument();
  });
});
