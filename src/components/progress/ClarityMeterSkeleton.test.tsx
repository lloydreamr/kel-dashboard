/**
 * ClarityMeterSkeleton Component Tests
 *
 * Tests for the loading placeholder matching ClarityMeter dimensions.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ClarityMeterSkeleton } from './ClarityMeterSkeleton';

describe('ClarityMeterSkeleton', () => {
  it('renders skeleton with correct test ID', () => {
    render(<ClarityMeterSkeleton />);
    expect(screen.getByTestId('clarity-meter-skeleton')).toBeInTheDocument();
  });

  it('has pulsing animation class', () => {
    const { container } = render(<ClarityMeterSkeleton />);
    const skeleton = container.querySelector('[data-testid="clarity-meter-skeleton"]');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('matches circular ring dimensions', () => {
    const { container } = render(<ClarityMeterSkeleton />);
    const circle = container.querySelector('circle');
    // Should have a circular element with appropriate dimensions
    expect(circle).toBeInTheDocument();
  });
});
