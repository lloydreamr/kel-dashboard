import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';

import { ConstraintConfirmButton } from './ConstraintConfirmButton';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  },
}));

// Mock useHaptic
const mockTriggerHaptic = vi.fn();
vi.mock('@/hooks/ui', () => ({
  useHaptic: () => ({
    trigger: mockTriggerHaptic,
  }),
}));

// Mock useApproveWithConstraints
const mockApproveAsync = vi.fn();
const mockReset = vi.fn();
vi.mock('@/hooks/decisions', () => ({
  useApproveWithConstraints: () => ({
    approveWithConstraintsAsync: mockApproveAsync,
    isPending: false,
    reset: mockReset,
  }),
  useUndoDecision: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  queryClient.setQueryData(queryKeys.questions.all, []);

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('ConstraintConfirmButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveAsync.mockResolvedValue({
      decision: { id: 'decision-1' },
      question: { id: 'q-1', status: 'approved' },
    });
  });

  it('renders confirm button', () => {
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('constraint-confirm-button')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('triggers medium haptic on click', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

    expect(mockTriggerHaptic).toHaveBeenCalledWith('medium');
  });

  it('calls approveWithConstraintsAsync with correct params', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }, { type: 'risk' }]}
        context="Under 50k"
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

    expect(mockApproveAsync).toHaveBeenCalledWith({
      questionId: 'q-1',
      constraints: [{ type: 'price' }, { type: 'risk' }],
      context: 'Under 50k',
    });
  });

  it('calls onSuccess callback on successful mutation', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onError callback on mutation failure', async () => {
    const error = new Error('Network error');
    mockApproveAsync.mockRejectedValueOnce(error);

    const user = userEvent.setup();
    const onError = vi.fn();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
        onError={onError}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('shows UndoToast with progress bar on success', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

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

  it('shows error toast on failure', async () => {
    const { toast } = await import('sonner');
    mockApproveAsync.mockRejectedValueOnce(new Error('Failed'));

    const user = userEvent.setup();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't save. Retry?",
        expect.objectContaining({
          action: expect.objectContaining({ label: 'Retry' }),
        })
      );
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
        disabled={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('constraint-confirm-button')).toBeDisabled();
  });

  it('has 48px minimum touch target', () => {
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByTestId('constraint-confirm-button');
    expect(button.className).toContain('min-h-[48px]');
  });

  it('renders without context when not provided', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintConfirmButton
        questionId="q-1"
        constraints={[{ type: 'volume' }]}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-confirm-button'));

    expect(mockApproveAsync).toHaveBeenCalledWith({
      questionId: 'q-1',
      constraints: [{ type: 'volume' }],
      context: undefined,
    });
  });
});
