import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DecisionTimestamp } from './DecisionTimestamp';

// Use fake timers for consistent relative time output (consistent with KelViewedIndicator tests)
const mockNow = new Date('2025-12-23T12:00:00Z');

describe('DecisionTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with correct test-id', () => {
    render(<DecisionTimestamp createdAt="2025-12-23T10:00:00Z" />);

    expect(screen.getByTestId('decision-timestamp')).toBeInTheDocument();
  });

  it('shows "Decided X ago" format with relative time', () => {
    render(<DecisionTimestamp createdAt="2025-12-23T10:00:00Z" />);

    expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
      'Decided 2 hours ago'
    );
  });

  it('handles recent timestamps showing "Just now"', () => {
    render(<DecisionTimestamp createdAt="2025-12-23T11:59:50Z" />);

    expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
      'Decided Just now'
    );
  });

  it('handles older timestamps with days', () => {
    render(<DecisionTimestamp createdAt="2025-12-20T12:00:00Z" />);

    expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
      'Decided 3 days ago'
    );
  });

  it('applies correct styling classes', () => {
    render(<DecisionTimestamp createdAt="2025-12-23T10:00:00Z" />);

    const element = screen.getByTestId('decision-timestamp');
    expect(element).toHaveClass('text-xs', 'text-muted-foreground');
  });

  describe('edge cases', () => {
    it('shows "Decided Unknown" for invalid dates', () => {
      render(<DecisionTimestamp createdAt="invalid-date" />);

      expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
        'Decided Unknown'
      );
    });

    it('shows absolute date for very old decisions (>30 days)', () => {
      render(<DecisionTimestamp createdAt="2025-11-01T12:00:00Z" />);

      expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
        'Decided Nov 1'
      );
    });
  });
});
