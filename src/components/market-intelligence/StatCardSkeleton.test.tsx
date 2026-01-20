import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StatCardSkeleton } from './StatCardSkeleton';

describe('StatCardSkeleton', () => {
  it('renders with correct test id', () => {
    render(<StatCardSkeleton />);

    expect(screen.getByTestId('mi-stat-card-skeleton')).toBeInTheDocument();
  });

  it('has animate-pulse class for loading animation', () => {
    render(<StatCardSkeleton />);

    const skeleton = screen.getByTestId('mi-stat-card-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders skeleton placeholders with bg-muted', () => {
    render(<StatCardSkeleton />);

    const skeleton = screen.getByTestId('mi-stat-card-skeleton');
    const placeholders = skeleton.querySelectorAll('.bg-muted');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('renders skeleton placeholder for title', () => {
    render(<StatCardSkeleton />);

    const skeleton = screen.getByTestId('mi-stat-card-skeleton');
    const titlePlaceholder = skeleton.querySelector('.h-4.w-20');
    expect(titlePlaceholder).toBeInTheDocument();
  });

  it('renders skeleton placeholder for count', () => {
    render(<StatCardSkeleton />);

    const skeleton = screen.getByTestId('mi-stat-card-skeleton');
    const countPlaceholder = skeleton.querySelector('.h-8.w-16');
    expect(countPlaceholder).toBeInTheDocument();
  });
});
