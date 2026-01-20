import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the hooks
vi.mock('@/hooks/milestones', () => ({
  useMilestones: vi.fn(),
}));

// Mock the child components
vi.mock('@/components/progress/CountdownBanner', () => ({
  CountdownBanner: () => <div data-testid="countdown-banner-mock">Countdown</div>,
}));

vi.mock('@/components/progress/CountdownBannerSkeleton', () => ({
  CountdownBannerSkeleton: () => (
    <div data-testid="countdown-skeleton-mock">Skeleton</div>
  ),
}));

vi.mock('@/components/progress/MilestoneCard', () => ({
  MilestoneCard: ({ milestone }: { milestone: { id: string } }) => (
    <div data-testid={`milestone-card-${milestone.id}`}>Milestone {milestone.id}</div>
  ),
}));

vi.mock('@/components/progress/MilestoneCardSkeleton', () => ({
  MilestoneCardSkeleton: () => (
    <div data-testid="milestone-skeleton">Skeleton</div>
  ),
}));

import { useMilestones } from '@/hooks/milestones';

import { ProgressPageClient } from './ProgressPageClient';

const mockUseMilestones = useMilestones as ReturnType<typeof vi.fn>;

describe('ProgressPageClient', () => {
  it('shows countdown banner skeleton and milestone skeletons during loading', () => {
    mockUseMilestones.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<ProgressPageClient />);

    expect(screen.getByTestId('countdown-skeleton-mock')).toBeInTheDocument();
    expect(screen.getAllByTestId('milestone-skeleton')).toHaveLength(3);
    expect(screen.queryByTestId('countdown-banner-mock')).not.toBeInTheDocument();
  });

  it('shows countdown banner and milestone cards when loaded', () => {
    const mockMilestones = [
      { id: '1', title: 'Milestone 1', progress: 50, status: 'in-progress' },
      { id: '2', title: 'Milestone 2', progress: 100, status: 'done' },
      { id: '3', title: 'Milestone 3', progress: 0, status: 'pending' },
    ];

    mockUseMilestones.mockReturnValue({
      data: mockMilestones,
      isLoading: false,
      error: null,
    });

    render(<ProgressPageClient />);

    expect(screen.getByTestId('countdown-banner-mock')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-card-3')).toBeInTheDocument();
    expect(screen.queryByTestId('countdown-skeleton-mock')).not.toBeInTheDocument();
  });

  it('shows error message when milestones fail to load', () => {
    mockUseMilestones.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(<ProgressPageClient />);

    expect(screen.getByTestId('progress-error')).toBeInTheDocument();
    expect(
      screen.getByText(/Failed to load milestones. Please try again./)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('countdown-banner-mock')).not.toBeInTheDocument();
  });

  it('countdown banner appears above milestone grid', () => {
    const mockMilestones = [
      { id: '1', title: 'Milestone 1', progress: 50, status: 'in-progress' },
    ];

    mockUseMilestones.mockReturnValue({
      data: mockMilestones,
      isLoading: false,
      error: null,
    });

    const { container } = render(<ProgressPageClient />);
    const pageDiv = container.querySelector('[data-testid="progress-page"]');
    const children = Array.from(pageDiv?.children || []);

    // First child should be countdown banner
    expect(children[0]).toHaveAttribute('data-testid', 'countdown-banner-mock');
    // Second child should be the grid
    expect(children[1]).toHaveClass('grid');
  });

  it('has correct spacing between countdown and milestones', () => {
    const mockMilestones = [
      { id: '1', title: 'Milestone 1', progress: 50, status: 'in-progress' },
    ];

    mockUseMilestones.mockReturnValue({
      data: mockMilestones,
      isLoading: false,
      error: null,
    });

    render(<ProgressPageClient />);

    const pageDiv = screen.getByTestId('progress-page');
    expect(pageDiv).toHaveClass('space-y-6');
  });
});
