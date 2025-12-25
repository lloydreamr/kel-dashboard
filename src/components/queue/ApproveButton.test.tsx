import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

import { ApproveButton } from './ApproveButton';

// Mock repositories
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    updateStatus: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock useProfile
vi.mock('@/hooks/auth', () => ({
  useProfile: () => ({
    data: { id: 'user-123', role: 'kel' },
    isLoading: false,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  },
}));

// Mock navigator.vibrate
const mockVibrate = vi.fn().mockReturnValue(true);
Object.defineProperty(global.navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

const mockQuestion = {
  id: 'q-1',
  title: 'Test Question',
  description: null,
  category: 'market' as const,
  status: 'ready_for_kel' as const,
  recommendation: 'Test recommendation',
  recommendation_rationale: null,
  created_by: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  viewed_by_kel_at: null,
};

const mockDecision = {
  id: 'decision-1',
  question_id: 'q-1',
  decision_type: 'approved' as const,
  created_by: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  constraints: null,
  constraint_context: null,
  reasoning: null,
  incorporated_at: null,
};

function renderButton(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ApproveButton question={mockQuestion} {...props} />
    </QueryClientProvider>
  );
}

describe('ApproveButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct text and testId', () => {
    renderButton();

    const button = screen.getByTestId('approve-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Approve');
  });

  it('has minimum 48px touch target', () => {
    renderButton();

    const button = screen.getByTestId('approve-button');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('triggers haptic feedback on click', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce({
      ...mockQuestion,
      status: 'approved',
    });

    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByTestId('approve-button'));

    expect(mockVibrate).toHaveBeenCalledWith(20); // light haptic = 20ms
  });

  it('shows loading state during mutation', async () => {
    // Slow mutation
    vi.mocked(decisionsRepo.create).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockDecision), 100);
        })
    );

    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByTestId('approve-button'));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows UndoToast with progress bar on success', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce({
      ...mockQuestion,
      status: 'approved',
    });

    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByTestId('approve-button'));

    await waitFor(() => {
      // Now uses toast.custom with UndoToast component (Story 4.13)
      expect(toast.custom).toHaveBeenCalledWith(
        expect.any(Function), // UndoToast render function
        expect.objectContaining({
          duration: Infinity, // UndoToast manages its own dismissal
        })
      );
    });
  });

  it('shows error toast with retry on failure', async () => {
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce(
      new Error('Network error')
    );

    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByTestId('approve-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't save. Retry?",
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Retry',
          }),
        })
      );
    });
  });

  it('calls onApproveStart when approve begins', async () => {
    vi.mocked(decisionsRepo.create).mockImplementation(
      () => new Promise(() => {})
    );

    const onApproveStart = vi.fn();
    const user = userEvent.setup();
    renderButton({ onApproveStart });

    await user.click(screen.getByTestId('approve-button'));

    expect(onApproveStart).toHaveBeenCalled();
  });

  it('calls onApproveComplete on success', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce({
      ...mockQuestion,
      status: 'approved',
    });

    const onApproveComplete = vi.fn();
    const user = userEvent.setup();
    renderButton({ onApproveComplete });

    await user.click(screen.getByTestId('approve-button'));

    await waitFor(() => {
      expect(onApproveComplete).toHaveBeenCalled();
    });
  });

  it('calls onApproveError on failure', async () => {
    const error = new Error('Network error');
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce(error);

    const onApproveError = vi.fn();
    const user = userEvent.setup();
    renderButton({ onApproveError });

    await user.click(screen.getByTestId('approve-button'));

    await waitFor(() => {
      expect(onApproveError).toHaveBeenCalledWith(error);
    });
  });

  it('is disabled while mutation is pending', async () => {
    vi.mocked(decisionsRepo.create).mockImplementation(
      () => new Promise(() => {})
    );

    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByTestId('approve-button'));

    expect(screen.getByTestId('approve-button')).toBeDisabled();
  });
});
