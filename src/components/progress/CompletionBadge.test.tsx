import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { CompletionBadge } from './CompletionBadge';

describe('CompletionBadge', () => {
  it('renders badge when completedAt is provided', () => {
    render(<CompletionBadge completedAt="2025-12-25T10:30:00Z" />);

    expect(screen.getByTestId('milestone-complete-badge')).toBeInTheDocument();
  });

  it('displays "✓ Complete" text', () => {
    render(<CompletionBadge completedAt="2025-12-25T10:30:00Z" />);

    expect(screen.getByText(/✓ Complete/i)).toBeInTheDocument();
  });

  it('displays formatted completion date', () => {
    render(<CompletionBadge completedAt="2025-12-25T10:30:00Z" />);

    const dateElement = screen.getByTestId('milestone-complete-date');
    expect(dateElement).toBeInTheDocument();
    // Format: "Dec 25, 2025"
    expect(dateElement.textContent).toMatch(/Dec 25, 2025/);
  });

  it('uses green success styling', () => {
    render(<CompletionBadge completedAt="2025-12-25T10:30:00Z" />);

    const badge = screen.getByTestId('milestone-complete-badge');
    expect(badge).toHaveClass('bg-green-100');

    const completionText = screen.getByText(/✓ Complete/i);
    expect(completionText).toHaveClass('text-green-700');
  });

  it('returns null when completedAt is null', () => {
    const { container } = render(<CompletionBadge completedAt={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when completedAt is undefined', () => {
    const { container } = render(<CompletionBadge completedAt={undefined as unknown as null} />);

    expect(container.firstChild).toBeNull();
  });

  it('handles invalid date gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<CompletionBadge completedAt="invalid-date" />);

    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'CompletionBadge: Invalid date provided:',
      'invalid-date'
    );

    consoleSpy.mockRestore();
  });

  it('formats different dates correctly', () => {
    const { rerender } = render(<CompletionBadge completedAt="2025-01-15T08:00:00Z" />);
    expect(screen.getByTestId('milestone-complete-date').textContent).toMatch(/Jan 15, 2025/);

    rerender(<CompletionBadge completedAt="2025-07-04T12:00:00Z" />);
    expect(screen.getByTestId('milestone-complete-date').textContent).toMatch(/Jul 4, 2025/);
  });
});
