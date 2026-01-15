import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { DashboardHeader } from './DashboardHeader';

describe('DashboardHeader', () => {
  beforeEach(() => {
    // Mock date to ensure consistent test output
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with correct test id', () => {
    render(<DashboardHeader lastUpdated={null} />);

    expect(screen.getByTestId('mi-dashboard-header')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<DashboardHeader lastUpdated={null} />);

    expect(screen.getByText('Market Intelligence Dashboard')).toBeInTheDocument();
  });

  it('renders h1 heading', () => {
    render(<DashboardHeader lastUpdated={null} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Market Intelligence Dashboard');
  });

  it('shows "No data yet" when lastUpdated is null', () => {
    render(<DashboardHeader lastUpdated={null} />);

    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });

  it('shows relative time when lastUpdated is provided', () => {
    const oneHourAgo = new Date('2024-06-15T11:00:00Z');
    render(<DashboardHeader lastUpdated={oneHourAgo} />);

    expect(screen.getByText(/about 1 hour ago/i)).toBeInTheDocument();
  });

  it('shows time ago for recent updates', () => {
    const justNow = new Date('2024-06-15T11:59:00Z');
    render(<DashboardHeader lastUpdated={justNow} />);

    // date-fns formats this as "1 minute ago" or "less than a minute ago"
    expect(screen.getByText(/minute ago/i)).toBeInTheDocument();
  });

  it('renders as header element', () => {
    render(<DashboardHeader lastUpdated={null} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('has responsive text size classes', () => {
    render(<DashboardHeader lastUpdated={null} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-2xl', 'md:text-3xl');
  });
});
