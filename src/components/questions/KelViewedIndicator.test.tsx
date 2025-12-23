import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { KelViewedIndicator } from './KelViewedIndicator';

// Mock date for consistent relative time
const mockNow = new Date('2025-12-23T12:00:00Z');

describe('KelViewedIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when viewedAt is null', () => {
    const { container } = render(<KelViewedIndicator viewedAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with correct test ID when viewedAt has value', () => {
    render(<KelViewedIndicator viewedAt="2025-12-23T10:00:00Z" />);
    expect(screen.getByTestId('kel-viewed-indicator')).toBeInTheDocument();
  });

  it('displays "Kel viewed" with relative time', () => {
    render(<KelViewedIndicator viewedAt="2025-12-23T10:00:00Z" />);
    expect(screen.getByText('Kel viewed 2 hours ago')).toBeInTheDocument();
  });

  it('shows green dot indicator', () => {
    render(<KelViewedIndicator viewedAt="2025-12-23T10:00:00Z" />);
    const indicator = screen.getByTestId('kel-viewed-indicator');
    const greenDot = indicator.querySelector('.bg-success');
    expect(greenDot).toBeInTheDocument();
  });

  it('shows "Just now" for recent views', () => {
    render(<KelViewedIndicator viewedAt="2025-12-23T11:59:50Z" />);
    expect(screen.getByText('Kel viewed Just now')).toBeInTheDocument();
  });

  it('shows days for older views', () => {
    render(<KelViewedIndicator viewedAt="2025-12-21T12:00:00Z" />);
    expect(screen.getByText('Kel viewed 2 days ago')).toBeInTheDocument();
  });
});
