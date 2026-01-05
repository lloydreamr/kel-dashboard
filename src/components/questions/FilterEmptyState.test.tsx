import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FilterEmptyState } from './FilterEmptyState';

describe('FilterEmptyState', () => {
  it('renders with the correct filter label', () => {
    render(<FilterEmptyState filter="draft" totalCount={5} />);

    expect(screen.getByTestId('filter-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no draft questions/i)).toBeInTheDocument();
  });

  it('shows suggestion when there are other questions', () => {
    render(<FilterEmptyState filter="sent" totalCount={10} />);

    expect(screen.getByText(/try a different filter to see your 10 questions/i)).toBeInTheDocument();
  });

  it('uses singular "question" when totalCount is 1', () => {
    render(<FilterEmptyState filter="decided" totalCount={1} />);

    expect(screen.getByText(/try a different filter to see your 1 question\./i)).toBeInTheDocument();
  });

  it('does not show suggestion when totalCount is 0', () => {
    render(<FilterEmptyState filter="draft" totalCount={0} />);

    expect(screen.queryByText(/try a different filter/i)).not.toBeInTheDocument();
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
