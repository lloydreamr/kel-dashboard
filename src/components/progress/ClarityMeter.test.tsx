/**
 * ClarityMeter Component Tests
 *
 * Tests for the circular progress meter with color coding and empty states.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ClarityMeter } from './ClarityMeter';

import type { MilestoneProgress } from '@/types';

describe('ClarityMeter', () => {
  it('displays percentage in center of ring', () => {
    const progress: MilestoneProgress = { total: 10, approved: 5, percentage: 50 };
    render(<ClarityMeter progress={progress} />);
    expect(screen.getByTestId('clarity-meter-percentage')).toHaveTextContent('50%');
  });

  it('displays count below ring', () => {
    const progress: MilestoneProgress = { total: 10, approved: 5, percentage: 50 };
    render(<ClarityMeter progress={progress} />);
    expect(screen.getByTestId('clarity-meter-count')).toHaveTextContent('5 of 10 approved');
  });

  it('shows gray color for 0-33%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 2, percentage: 20 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-muted-foreground');
    expect(progressCircle).toBeInTheDocument();
  });

  it('shows amber color for 34-66%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 5, percentage: 50 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-amber-500');
    expect(progressCircle).toBeInTheDocument();
  });

  it('shows green color for 67-100%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 8, percentage: 80 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-green-500');
    expect(progressCircle).toBeInTheDocument();
  });

  it('handles boundary case: 33% shows gray', () => {
    const progress: MilestoneProgress = { total: 100, approved: 33, percentage: 33 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-muted-foreground');
    expect(progressCircle).toBeInTheDocument();
  });

  it('handles boundary case: 34% shows amber', () => {
    const progress: MilestoneProgress = { total: 100, approved: 34, percentage: 34 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-amber-500');
    expect(progressCircle).toBeInTheDocument();
  });

  it('handles boundary case: 66% shows amber', () => {
    const progress: MilestoneProgress = { total: 100, approved: 66, percentage: 66 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-amber-500');
    expect(progressCircle).toBeInTheDocument();
  });

  it('handles boundary case: 67% shows green', () => {
    const progress: MilestoneProgress = { total: 100, approved: 67, percentage: 67 };
    const { container } = render(<ClarityMeter progress={progress} />);
    const progressCircle = container.querySelector('circle.stroke-green-500');
    expect(progressCircle).toBeInTheDocument();
  });

  it('shows empty state when no questions', () => {
    const progress: MilestoneProgress = { total: 0, approved: 0, percentage: 0 };
    render(<ClarityMeter progress={progress} />);
    expect(screen.getByTestId('clarity-meter-empty')).toBeInTheDocument();
    expect(screen.getByText('No questions')).toBeInTheDocument();
  });

  it('shows empty state when progress is null', () => {
    render(<ClarityMeter progress={null} />);
    expect(screen.getByTestId('clarity-meter-empty')).toBeInTheDocument();
  });

  it('triggers celebration animation at 100%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 10, percentage: 100 };
    render(<ClarityMeter progress={progress} />);
    // Note: Animation plays once via useEffect state tracking (AC2).
    // Animation behavior is internal to Framer Motion and tested via E2E, not unit tests.
    // Here we verify the component renders correctly at 100%.
    expect(screen.getByTestId('clarity-meter-percentage')).toHaveTextContent('100%');
    expect(screen.getByTestId('clarity-meter')).toBeInTheDocument();
  });

  it('handles invalid percentage: NaN defaults to 0%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 5, percentage: NaN };
    render(<ClarityMeter progress={progress} />);
    expect(screen.getByTestId('clarity-meter-percentage')).toHaveTextContent('0%');
  });

  it('handles invalid percentage: negative defaults to 0%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 0, percentage: -10 };
    render(<ClarityMeter progress={progress} />);
    expect(screen.getByTestId('clarity-meter-percentage')).toHaveTextContent('0%');
  });

  it('handles invalid percentage: over 100 clamps to 100%', () => {
    const progress: MilestoneProgress = { total: 10, approved: 12, percentage: 120 };
    render(<ClarityMeter progress={progress} />);
    expect(screen.getByTestId('clarity-meter-percentage')).toHaveTextContent('100%');
  });

  it('renders with loading state skeleton', () => {
    render(<ClarityMeter progress={null} isLoading />);
    expect(screen.queryByTestId('clarity-meter')).not.toBeInTheDocument();
  });
});
