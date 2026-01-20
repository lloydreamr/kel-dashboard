import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { StaleDataBadge } from './StaleDataBadge';

describe('StaleDataBadge', () => {
  // Mock current date for consistent tests
  const mockNow = new Date('2025-12-29T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing for fresh data (today)', () => {
    render(<StaleDataBadge updatedAt={new Date().toISOString()} />);
    expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
  });

  it('renders nothing for data updated 13 days ago', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 13);
    render(<StaleDataBadge updatedAt={date.toISOString()} />);
    expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
  });

  it('renders nothing for data updated exactly 14 days ago (boundary)', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 14);
    render(<StaleDataBadge updatedAt={date.toISOString()} />);
    expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
  });

  it('renders badge for stale data (15 days ago)', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 15);
    render(<StaleDataBadge updatedAt={date.toISOString()} />);
    expect(screen.getByTestId('stale-data-indicator')).toBeInTheDocument();
  });

  it('renders badge for very stale data (30 days ago)', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 30);
    render(<StaleDataBadge updatedAt={date.toISOString()} />);
    expect(screen.getByTestId('stale-data-indicator')).toBeInTheDocument();
  });

  it('renders "Stale" text in badge', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 20);
    render(<StaleDataBadge updatedAt={date.toISOString()} />);
    expect(screen.getByText('Stale')).toBeInTheDocument();
  });

  it('renders nothing for null date', () => {
    render(<StaleDataBadge updatedAt={null} />);
    expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
  });

  it('renders nothing for undefined date', () => {
    render(<StaleDataBadge updatedAt={undefined} />);
    expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
  });

  it('respects custom threshold', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 5);
    // Default threshold (14) - not stale
    const { rerender } = render(<StaleDataBadge updatedAt={date.toISOString()} />);
    expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();

    // Custom threshold (3) - stale
    rerender(<StaleDataBadge updatedAt={date.toISOString()} thresholdDays={3} />);
    expect(screen.getByTestId('stale-data-indicator')).toBeInTheDocument();
  });

  // Note: Tooltip hover tests are skipped because Radix tooltips don't work well
  // with fake timers in JSDOM. The tooltip functionality is tested via E2E tests.
  // The badge rendering and conditional display logic is fully covered above.

  it('renders AlertTriangle icon', () => {
    const date = new Date(mockNow);
    date.setDate(date.getDate() - 20);
    render(<StaleDataBadge updatedAt={date.toISOString()} />);

    const badge = screen.getByTestId('stale-data-indicator');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
