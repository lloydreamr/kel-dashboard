import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecentOpportunitiesSkeleton } from './RecentOpportunitiesSkeleton';

describe('RecentOpportunitiesSkeleton', () => {
  it('renders with correct test id', () => {
    render(<RecentOpportunitiesSkeleton />);

    expect(screen.getByTestId('mi-recent-opportunities-skeleton')).toBeInTheDocument();
  });

  it('has animate-pulse class for loading animation', () => {
    render(<RecentOpportunitiesSkeleton />);

    const skeleton = screen.getByTestId('mi-recent-opportunities-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders 3 placeholder items', () => {
    render(<RecentOpportunitiesSkeleton />);

    const skeleton = screen.getByTestId('mi-recent-opportunities-skeleton');
    const items = skeleton.querySelectorAll('.border-b');
    // 3 items but last one has last:border-0 so it won't show border
    expect(items.length).toBe(3);
  });

  it('renders skeleton placeholders with bg-muted', () => {
    render(<RecentOpportunitiesSkeleton />);

    const skeleton = screen.getByTestId('mi-recent-opportunities-skeleton');
    const placeholders = skeleton.querySelectorAll('.bg-muted');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('renders header placeholder for title', () => {
    render(<RecentOpportunitiesSkeleton />);

    const skeleton = screen.getByTestId('mi-recent-opportunities-skeleton');
    const titlePlaceholder = skeleton.querySelector('.h-6.w-36');
    expect(titlePlaceholder).toBeInTheDocument();
  });

  it('renders header placeholder for button', () => {
    render(<RecentOpportunitiesSkeleton />);

    const skeleton = screen.getByTestId('mi-recent-opportunities-skeleton');
    const buttonPlaceholder = skeleton.querySelector('.h-8.w-20');
    expect(buttonPlaceholder).toBeInTheDocument();
  });
});
