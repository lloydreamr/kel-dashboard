import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useProfile } from '@/hooks/auth';
import { useMilestoneProgress } from '@/hooks/milestones';

import { MilestoneCard } from './MilestoneCard';

import type { Milestone, Profile } from '@/types';

// Mock the hooks
vi.mock('@/hooks/milestones', () => ({
  useMilestoneProgress: vi.fn(() => ({
    data: { total: 10, approved: 5, percentage: 50 },
    isLoading: false,
  })),
  useMarkMilestoneComplete: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useMilestoneNotes: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateMilestoneNote: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateMilestoneNote: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteMilestoneNote: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/auth', () => ({
  useProfile: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockMilestone = (overrides?: Partial<Milestone>): Milestone => ({
  id: '123',
  category: 'market',
  status: 'in_progress',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  completed_at: null,
  completed_by: null,
  ...overrides,
});

const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'user-123',
  email: 'maho@example.com',
  role: 'maho',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

describe('MilestoneCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Default: Maho user
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    // Default: Progress data loaded
    vi.mocked(useMilestoneProgress).mockReturnValue({
      data: { total: 10, approved: 5, percentage: 50 },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('displays milestone category and status', () => {
    // Arrange
    const milestone = createMockMilestone({ category: 'market', status: 'in_progress' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('milestone-card-market')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-status-badge')).toHaveTextContent('In Progress');
  });

  it('displays progress count via ClarityMeter', () => {
    // Arrange
    const milestone = createMockMilestone({ category: 'product' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('clarity-meter-count')).toHaveTextContent('5 of 10 approved');
  });

  it('displays percentage via ClarityMeter', () => {
    // Arrange
    const milestone = createMockMilestone({ category: 'distribution' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('clarity-meter-percentage')).toHaveTextContent('50%');
  });

  it('shows category icon and label', () => {
    // Arrange
    const milestone = createMockMilestone({ category: 'market' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByText(/📊/)).toBeInTheDocument();
    expect(screen.getByText(/Market/)).toBeInTheDocument();
  });

  it('shows empty state when no questions exist (AC3)', () => {
    // Arrange
    vi.mocked(useMilestoneProgress).mockReturnValue({
      data: { total: 0, approved: 0, percentage: 0 },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const milestone = createMockMilestone({ category: 'market', status: 'not_started' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert - ClarityMeter shows empty state instead of 0%
    expect(screen.getByTestId('clarity-meter-empty')).toBeInTheDocument();
    expect(screen.getByText('No questions')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-status-badge')).toHaveTextContent('Not Started');
  });

  it('shows MilestoneCardSkeleton during loading (AC4)', () => {
    // Arrange
    vi.mocked(useMilestoneProgress).mockReturnValue({
      data: null,
      isLoading: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const milestone = createMockMilestone({ category: 'product' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert - AC4: Shows skeleton during loading
    expect(screen.getByTestId('milestone-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('clarity-meter')).not.toBeInTheDocument();
  });

  // New tests for Story 5.5
  it('shows MarkCompleteButton for Maho when milestone is in_progress', () => {
    // Arrange
    const milestone = createMockMilestone({ status: 'in_progress' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('mark-milestone-complete-button')).toBeInTheDocument();
  });

  it('does not show MarkCompleteButton for Kel', () => {
    // Arrange
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'kel' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('shows CompletionBadge when milestone is complete', () => {
    // Arrange
    const milestone = createMockMilestone({
      status: 'complete',
      completed_at: '2025-12-25T10:30:00Z',
    });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('milestone-complete-badge')).toBeInTheDocument();
    expect(screen.getByText(/✓ Complete/i)).toBeInTheDocument();
    expect(screen.queryByTestId('milestone-status-badge')).not.toBeInTheDocument();
  });

  it('does not show MarkCompleteButton when milestone is complete', () => {
    // Arrange
    const milestone = createMockMilestone({
      status: 'complete',
      completed_at: '2025-12-25T10:30:00Z',
    });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('shows regular Badge when milestone is not complete', () => {
    // Arrange
    const milestone = createMockMilestone({ status: 'not_started' });

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <MilestoneCard milestone={milestone} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId('milestone-status-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('milestone-complete-badge')).not.toBeInTheDocument();
  });
});
