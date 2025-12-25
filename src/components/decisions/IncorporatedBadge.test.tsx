import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IncorporatedBadge } from './IncorporatedBadge';

// Mock formatRelativeTime for predictable output
vi.mock('@/lib/utils/date', () => ({
  formatRelativeTime: vi.fn((date: string) => {
    if (date.includes('2024-01-01T10:00')) return '2 hours ago';
    if (date.includes('2024-01-02')) return '1 day ago';
    return 'some time ago';
  }),
}));

describe('IncorporatedBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct test-id', () => {
    render(<IncorporatedBadge />);
    expect(screen.getByTestId('incorporated-badge')).toBeInTheDocument();
  });

  it('displays "Incorporated" text', () => {
    render(<IncorporatedBadge />);
    expect(screen.getByText('Incorporated')).toBeInTheDocument();
  });

  it('applies success styling', () => {
    render(<IncorporatedBadge />);
    const badge = screen.getByTestId('incorporated-badge');
    expect(badge).toHaveClass('bg-success/10');
    expect(badge).toHaveClass('text-success');
  });

  it('applies custom className when provided', () => {
    render(<IncorporatedBadge className="custom-class" />);
    const badge = screen.getByTestId('incorporated-badge');
    expect(badge).toHaveClass('custom-class');
  });

  describe('Timestamp Display (Story 4-9)', () => {
    it('shows badge without timestamp when no incorporatedAt', () => {
      render(<IncorporatedBadge />);

      expect(screen.getByTestId('incorporated-badge')).toBeInTheDocument();
      expect(
        screen.queryByTestId('incorporated-timestamp')
      ).not.toBeInTheDocument();
    });

    it('shows badge with timestamp when incorporatedAt provided', () => {
      render(<IncorporatedBadge incorporatedAt="2024-01-01T10:00:00Z" />);

      expect(screen.getByTestId('incorporated-badge')).toBeInTheDocument();
      expect(screen.getByTestId('incorporated-timestamp')).toBeInTheDocument();
    });

    it('timestamp uses formatRelativeTime', () => {
      render(<IncorporatedBadge incorporatedAt="2024-01-01T10:00:00Z" />);

      expect(screen.getByTestId('incorporated-timestamp')).toHaveTextContent(
        '2 hours ago'
      );
    });

    it('has incorporated-timestamp test-id', () => {
      render(<IncorporatedBadge incorporatedAt="2024-01-02T12:00:00Z" />);

      const timestamp = screen.getByTestId('incorporated-timestamp');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp).toHaveTextContent('1 day ago');
    });
  });
});
