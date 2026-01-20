import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SortDropdown } from './SortDropdown';

import type { SortKey } from '@/types/question';

/**
 * SortDropdown tests
 *
 * Note: Radix UI Select uses portals that don't work well in jsdom.
 * Tests focus on render behavior and accessibility rather than
 * click interactions which are covered by e2e tests.
 */
describe('SortDropdown', () => {
  const defaultProps = {
    value: 'newest' as SortKey,
    onChange: vi.fn(),
  };

  it('renders with the correct initial value', () => {
    render(<SortDropdown {...defaultProps} />);

    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dropdown-trigger')).toHaveTextContent(
      'Newest first'
    );
  });

  it('renders the sort icon', () => {
    render(<SortDropdown {...defaultProps} />);

    // The ArrowUpDown icon should be present
    const container = screen.getByTestId('sort-dropdown');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<SortDropdown {...defaultProps} />);

    const trigger = screen.getByTestId('sort-dropdown-trigger');
    expect(trigger).toHaveAttribute('aria-label', 'Sort questions by');
  });

  it('displays the selected value when changed', () => {
    const { rerender } = render(<SortDropdown {...defaultProps} />);

    expect(screen.getByTestId('sort-dropdown-trigger')).toHaveTextContent(
      'Newest first'
    );

    rerender(<SortDropdown {...defaultProps} value="evidence" />);

    expect(screen.getByTestId('sort-dropdown-trigger')).toHaveTextContent(
      'Most evidence'
    );
  });

  it('displays oldest first label when value is oldest', () => {
    render(<SortDropdown {...defaultProps} value="oldest" />);

    expect(screen.getByTestId('sort-dropdown-trigger')).toHaveTextContent(
      'Oldest first'
    );
  });

  it('displays recently updated label when value is updated', () => {
    render(<SortDropdown {...defaultProps} value="updated" />);

    expect(screen.getByTestId('sort-dropdown-trigger')).toHaveTextContent(
      'Recently updated'
    );
  });

  it('displays alphabetical label when value is title', () => {
    render(<SortDropdown {...defaultProps} value="title" />);

    expect(screen.getByTestId('sort-dropdown-trigger')).toHaveTextContent(
      'Alphabetical'
    );
  });

  it('has correct trigger styling', () => {
    render(<SortDropdown {...defaultProps} />);

    const trigger = screen.getByTestId('sort-dropdown-trigger');
    expect(trigger).toHaveClass('w-40');
    expect(trigger).toHaveClass('min-h-10');
  });
});
