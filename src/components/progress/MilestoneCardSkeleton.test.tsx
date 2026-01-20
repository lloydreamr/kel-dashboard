import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { MilestoneCardSkeleton } from './MilestoneCardSkeleton';

describe('MilestoneCardSkeleton', () => {
  it('renders skeleton with testid', () => {
    // Arrange & Act
    render(<MilestoneCardSkeleton />);

    // Assert
    expect(screen.getByTestId('milestone-card-skeleton')).toBeInTheDocument();
  });

  it('has animate-pulse class', () => {
    // Arrange & Act
    render(<MilestoneCardSkeleton />);

    // Assert
    const skeleton = screen.getByTestId('milestone-card-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });
});
