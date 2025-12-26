import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CountdownBannerSkeleton } from './CountdownBannerSkeleton';

describe('CountdownBannerSkeleton', () => {
  it('renders skeleton with correct test id', () => {
    render(<CountdownBannerSkeleton />);
    expect(screen.getByTestId('wofex-countdown-skeleton')).toBeInTheDocument();
  });

  it('has pulse animation', () => {
    render(<CountdownBannerSkeleton />);
    const skeleton = screen.getByTestId('wofex-countdown-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('matches banner height', () => {
    render(<CountdownBannerSkeleton />);
    const skeleton = screen.getByTestId('wofex-countdown-skeleton');
    expect(skeleton).toHaveClass('h-20');
  });
});
