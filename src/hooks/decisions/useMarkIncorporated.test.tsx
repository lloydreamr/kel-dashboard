import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';

import { useMarkIncorporated } from './useMarkIncorporated';

import type { Decision } from '@/types/decision';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock decisions repository
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    markIncorporated: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createWrapperWithDecision(decision: Decision) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(
    queryKeys.decisions.byQuestion(decision.question_id),
    decision
  );

  return { wrapper: TestWrapper, queryClient };

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
}

const mockDecision: Decision = {
  id: 'decision-1',
  question_id: 'q-1',
  decision_type: 'approved_with_constraint',
  constraints: [{ type: 'price' }],
  constraint_context: 'Under 100k budget',
  reasoning: null,
  created_by: 'user-1',
  incorporated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const incorporatedDecision: Decision = {
  ...mockDecision,
  incorporated_at: '2024-01-02T10:30:00Z',
};

describe('useMarkIncorporated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useMarkIncorporated(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
    expect(typeof result.current.reset).toBe('function');
  });

  it('calls decisionsRepo.markIncorporated with correct ID', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.markIncorporated).mockResolvedValue(
      incorporatedDecision
    );

    const { result } = renderHook(() => useMarkIncorporated(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.markIncorporated).toHaveBeenCalledWith('decision-1');
  });

  it('shows success toast on successful mark', async () => {
    const { toast } = await import('sonner');
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.markIncorporated).mockResolvedValue(
      incorporatedDecision
    );

    const { result } = renderHook(() => useMarkIncorporated(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Marked as incorporated', {
        id: 'mark-incorporated-decision-1',
        duration: 3000,
      });
    });
  });

  it('invalidates query on success', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.markIncorporated).mockResolvedValue(
      incorporatedDecision
    );

    const { wrapper, queryClient } = createWrapperWithDecision(mockDecision);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkIncorporated(), { wrapper });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.decisions.byQuestion('q-1'),
      });
    });
  });

  it('shows error toast on failure', async () => {
    const { toast } = await import('sonner');
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.markIncorporated).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useMarkIncorporated(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't mark as incorporated. Try again?",
      expect.objectContaining({
        id: 'mark-incorporated-error-decision-1',
        action: expect.objectContaining({
          label: 'Retry',
        }),
      })
    );
  });

  it('sets isPending to true during mutation', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    let resolveMarkIncorporated: (value: Decision) => void;
    const markPromise = new Promise<Decision>((resolve) => {
      resolveMarkIncorporated = resolve;
    });
    vi.mocked(decisionsRepo.markIncorporated).mockReturnValue(markPromise);

    const { result } = renderHook(() => useMarkIncorporated(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolveMarkIncorporated!(incorporatedDecision);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('returns isSuccess true after completion', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.markIncorporated).mockResolvedValue(
      incorporatedDecision
    );

    const { result } = renderHook(() => useMarkIncorporated(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('performs optimistic update setting incorporated_at', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    const { wrapper, queryClient } = createWrapperWithDecision(mockDecision);
    vi.mocked(decisionsRepo.markIncorporated).mockResolvedValue(
      incorporatedDecision
    );

    const { result } = renderHook(() => useMarkIncorporated(), { wrapper });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    // Check optimistic update was applied
    const cachedDecision = queryClient.getQueryData<Decision>(
      queryKeys.decisions.byQuestion('q-1')
    );
    expect(cachedDecision?.incorporated_at).not.toBeNull();
  });

  it('rolls back optimistic update on error', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    const { wrapper, queryClient } = createWrapperWithDecision(mockDecision);
    vi.mocked(decisionsRepo.markIncorporated).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useMarkIncorporated(), { wrapper });

    await act(async () => {
      result.current.markIncorporated({
        decisionId: 'decision-1',
        questionId: 'q-1',
      });
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // Check rollback was applied - incorporated_at should be null again
    const cachedDecision = queryClient.getQueryData<Decision>(
      queryKeys.decisions.byQuestion('q-1')
    );
    expect(cachedDecision?.incorporated_at).toBeNull();
  });
});
