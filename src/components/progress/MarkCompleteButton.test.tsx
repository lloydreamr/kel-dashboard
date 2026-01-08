import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useProfile } from '@/hooks/auth';
import { useMarkMilestoneComplete } from '@/hooks/milestones';

import { MarkCompleteButton } from './MarkCompleteButton';

import type { Milestone, Profile } from '@/types';

// INLINE factory functions (project pattern - NOT from shared module)
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

// Mock hooks
vi.mock('@/hooks/auth', () => ({
  useProfile: vi.fn(),
}));

vi.mock('@/hooks/milestones', () => ({
  useMarkMilestoneComplete: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MarkCompleteButton', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  // Helper to render with QueryClientProvider
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('renders button when user is Maho and milestone is in_progress', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    expect(screen.getByTestId('mark-milestone-complete-button')).toBeInTheDocument();
  });

  it('does not render when user is Kel (AC4)', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'kel' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('does not render when profile is loading', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('does not render when profile is null (unauthenticated)', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('does not render when milestone is already complete (AC3)', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'complete' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('does not render when milestone is not_started', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'not_started' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    expect(screen.queryByTestId('mark-milestone-complete-button')).not.toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    await user.click(screen.getByTestId('mark-milestone-complete-button'));

    expect(screen.getByTestId('milestone-complete-dialog')).toBeInTheDocument();
  });

  it('calls mutation with correct parameters on confirm', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn((variables, options) => {
      // Simulate successful mutation
      if (options?.onSuccess) {
        options.onSuccess();
      }
    });
    vi.mocked(useMarkMilestoneComplete).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-123', role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ id: 'milestone-456', status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    await user.click(screen.getByTestId('mark-milestone-complete-button'));
    await user.click(screen.getByTestId('milestone-complete-confirm'));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'milestone-456', userId: 'user-123' },
      expect.any(Object)
    );

    // Verify toast.success was called with correct message (AC2)
    expect(toast.success).toHaveBeenCalledWith('Milestone marked complete');
  });

  it('shows error toast when mutation fails', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn((variables, options) => {
      // Simulate failed mutation
      if (options?.onError) {
        options.onError(new Error('Network error'));
      }
    });
    vi.mocked(useMarkMilestoneComplete).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-123', role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ id: 'milestone-456', status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    await user.click(screen.getByTestId('mark-milestone-complete-button'));
    await user.click(screen.getByTestId('milestone-complete-confirm'));

    // Verify toast.error was called with retry guidance (AC5)
    expect(toast.error).toHaveBeenCalledWith('Failed to mark milestone complete. Please try again.');
  });

  it('has 48px touch target', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    const button = screen.getByTestId('mark-milestone-complete-button');
    expect(button).toHaveClass('min-h-12');
  });

  it('closes dialog and does not call mutation when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    vi.mocked(useMarkMilestoneComplete).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    // Open dialog
    await user.click(screen.getByTestId('mark-milestone-complete-button'));
    expect(screen.getByTestId('milestone-complete-dialog')).toBeInTheDocument();

    // Click Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Dialog should close
    expect(screen.queryByTestId('milestone-complete-dialog')).not.toBeInTheDocument();

    // Mutation should NOT have been called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows loading state on button when mutation is pending', () => {
    vi.mocked(useMarkMilestoneComplete).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const milestone = createMockMilestone({ status: 'in_progress' });
    renderWithProviders(<MarkCompleteButton milestone={milestone} />);

    const button = screen.getByTestId('mark-milestone-complete-button');
    expect(button).toHaveTextContent('Processing...');
    expect(button).toBeDisabled();
  });
});
