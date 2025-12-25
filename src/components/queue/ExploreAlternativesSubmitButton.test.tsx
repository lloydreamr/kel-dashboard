import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';

import { ExploreAlternativesSubmitButton } from './ExploreAlternativesSubmitButton';

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

// Mock decision hooks
const mockExploreAlternativesAsync = vi.fn();
vi.mock('@/hooks/decisions', () => ({
  useExploreAlternatives: () => ({
    exploreAlternativesAsync: mockExploreAlternativesAsync,
    isPending: false,
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

describe('ExploreAlternativesSubmitButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExploreAlternativesAsync.mockResolvedValue({
      decision: { id: 'decision-1' },
      question: { id: 'q-1', status: 'exploring_alternatives' },
    });
  });

  it('renders with correct text', () => {
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="Some reasoning"
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toHaveTextContent(
      'Submit'
    );
  });

  it('has correct test-id', () => {
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="Some reasoning"
      />,
      { wrapper: createWrapper() }
    );
    expect(
      screen.getByTestId('alternatives-submit-button')
    ).toBeInTheDocument();
  });

  it('is disabled when reasoning is empty', () => {
    render(
      <ExploreAlternativesSubmitButton questionId="q-1" reasoning="" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toBeDisabled();
  });

  it('is disabled when reasoning is only whitespace', () => {
    render(
      <ExploreAlternativesSubmitButton questionId="q-1" reasoning="   " />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toBeDisabled();
  });

  it('is enabled when reasoning has content', () => {
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="Valid reasoning"
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toBeEnabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="Some reasoning"
        disabled={true}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toBeDisabled();
  });

  it('triggers warning haptic on click', async () => {
    const user = userEvent.setup();
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="My concerns"
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-submit-button'));

    expect(mockTriggerHaptic).toHaveBeenCalledWith('warning');
  });

  it('calls exploreAlternativesAsync with correct params', async () => {
    const user = userEvent.setup();
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="  My concerns  "
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(mockExploreAlternativesAsync).toHaveBeenCalledWith({
        questionId: 'q-1',
        reasoning: 'My concerns', // trimmed
      });
    });
  });

  it('shows UndoToast with progress bar on success', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="My concerns"
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-submit-button'));

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

  it('calls onSuccess callback on success', async () => {
    const mockOnSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="My concerns"
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    mockExploreAlternativesAsync.mockRejectedValueOnce(
      new Error('Network error')
    );
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="My concerns"
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Couldn't send. Retry?", {
        id: 'explore-alternatives-error-q-1',
        action: expect.objectContaining({
          label: 'Retry',
        }),
      });
    });
  });

  it('calls onError callback on failure', async () => {
    mockExploreAlternativesAsync.mockRejectedValueOnce(
      new Error('Network error')
    );
    const mockOnError = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="My concerns"
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('has minimum 48px height for touch target', () => {
    render(
      <ExploreAlternativesSubmitButton
        questionId="q-1"
        reasoning="Some reasoning"
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toHaveClass(
      'min-h-[48px]'
    );
  });
});
