import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import {
  CountdownBanner,
  calculateDaysUntilWofex,
} from './CountdownBanner';

// Mock the date for consistent testing
const mockDate = (dateString: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(dateString));
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CountdownBanner', () => {
  it('displays days remaining before WOFEX', () => {
    mockDate('2026-07-01');
    render(<CountdownBanner />);
    expect(screen.getByTestId('wofex-days-remaining')).toHaveTextContent('28');
    expect(screen.getByText(/days until WOFEX 2026/)).toBeInTheDocument();
  });

  it('displays "TODAY" message on WOFEX day', () => {
    mockDate('2026-07-29');
    render(<CountdownBanner />);
    expect(screen.getByText(/WOFEX 2026 is TODAY! 🎉/)).toBeInTheDocument();
  });

  it('displays "complete" message after WOFEX', () => {
    mockDate('2026-08-01');
    render(<CountdownBanner />);
    expect(screen.getByText(/WOFEX 2026 complete/)).toBeInTheDocument();
  });

  it('shows date display', () => {
    mockDate('2026-01-01');
    render(<CountdownBanner />);
    expect(screen.getByTestId('wofex-date-display')).toHaveTextContent(
      'July 29, 2026'
    );
  });

  it('uses sage color scheme for banner', () => {
    mockDate('2026-01-01');
    render(<CountdownBanner />);
    const banner = screen.getByTestId('wofex-countdown-banner');
    expect(banner).toHaveClass('bg-primary/10');
  });

  it('has proper accessibility attributes', () => {
    mockDate('2026-01-01');
    render(<CountdownBanner />);
    const banner = screen.getByTestId('wofex-countdown-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-label');
  });

  it('has correct aria-label for countdown state', () => {
    mockDate('2026-07-01');
    render(<CountdownBanner />);
    const banner = screen.getByTestId('wofex-countdown-banner');
    expect(banner).toHaveAttribute('aria-label', '28 days until WOFEX 2026');
  });

  it('has correct aria-label for today state', () => {
    mockDate('2026-07-29');
    render(<CountdownBanner />);
    const banner = screen.getByTestId('wofex-countdown-banner');
    expect(banner).toHaveAttribute('aria-label', 'WOFEX 2026 is today');
  });

  it('has correct aria-label for complete state', () => {
    mockDate('2026-08-01');
    render(<CountdownBanner />);
    const banner = screen.getByTestId('wofex-countdown-banner');
    expect(banner).toHaveAttribute('aria-label', 'WOFEX 2026 is complete');
  });

  it('handles invalid date gracefully by showing skeleton', () => {
    // Mock Date constructor to return invalid date
    const originalDate = global.Date;
    vi.stubGlobal(
      'Date',
      class extends originalDate {
        constructor(value?: string | number | Date) {
          if (arguments.length === 0) {
            super('invalid');
          } else {
            super(value!);
          }
        }
      }
    );

    render(<CountdownBanner />);
    expect(screen.getByTestId('wofex-countdown-skeleton')).toBeInTheDocument();
    expect(
      screen.queryByTestId('wofex-countdown-banner')
    ).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});

describe('calculateDaysUntilWofex', () => {
  beforeEach(() => {
    // Use real timers for these tests
    vi.useRealTimers();
  });

  it('returns NaN for invalid date input', () => {
    expect(calculateDaysUntilWofex(new Date('invalid'))).toBeNaN();
  });

  it('calculates correct days for valid dates', () => {
    const result = calculateDaysUntilWofex(new Date('2026-07-01'));
    expect(result).toBe(28);
  });

  it('returns 0 for WOFEX day itself', () => {
    const result = calculateDaysUntilWofex(new Date('2026-07-29'));
    expect(result).toBe(0);
  });

  it('returns negative number for dates after WOFEX', () => {
    const result = calculateDaysUntilWofex(new Date('2026-08-01'));
    expect(result).toBeLessThan(0);
  });

  it('normalizes time to midnight', () => {
    // Same day but different times should give same result
    const morning = calculateDaysUntilWofex(new Date('2026-07-01T08:00:00'));
    const evening = calculateDaysUntilWofex(new Date('2026-07-01T20:00:00'));
    expect(morning).toBe(evening);
  });

  it('handles timezone differences correctly', () => {
    // Function normalizes to LOCAL midnight, so countdown is consistent
    // regardless of user's timezone
    // July 28 at any time in user's local timezone = 1 day before July 29
    const testDate = new Date('2026-07-28T12:00:00');
    const result = calculateDaysUntilWofex(testDate);
    expect(result).toBe(1);
  });
});
