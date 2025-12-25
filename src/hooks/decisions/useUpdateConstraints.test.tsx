import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';

import { useUpdateConstraints } from './useUpdateConstraints';

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
    update: vi.fn(),
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
  constraint_context: 'Initial context',
  reasoning: null,
  created_by: 'user-1',
  incorporated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('useUpdateConstraints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it('updates constraints successfully', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    const updatedDecision: Decision = {
      ...mockDecision,
      constraints: [{ type: 'volume' }, { type: 'timeline' }],
      constraint_context: 'Updated context',
    };
    vi.mocked(decisionsRepo.update).mockResolvedValue(updatedDecision);

    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'volume' }, { type: 'timeline' }],
        context: 'Updated context',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.update).toHaveBeenCalledWith('decision-1', {
      constraints: [{ type: 'volume' }, { type: 'timeline' }],
      constraint_context: 'Updated context',
    });
  });

  it('shows success toast on successful update', async () => {
    const { toast } = await import('sonner');
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.update).mockResolvedValue(mockDecision);

    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'price' }],
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Constraints updated', {
        id: 'update-constraints-decision-1',
        duration: 3000,
      });
    });
  });

  it('handles error and shows error toast', async () => {
    const { toast } = await import('sonner');
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.update).mockRejectedValue(
      new Error('Update failed')
    );

    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'price' }],
      });
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(toast.error).toHaveBeenCalledWith("Couldn't update. Try again?", {
      id: 'update-constraints-error-decision-1',
      action: expect.objectContaining({
        label: 'Retry',
      }),
    });
  });

  it('sets isPending to true during mutation', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    let resolveUpdate: (value: Decision) => void;
    const updatePromise = new Promise<Decision>((resolve) => {
      resolveUpdate = resolve;
    });
    vi.mocked(decisionsRepo.update).mockReturnValue(updatePromise);

    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'price' }],
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolveUpdate!(mockDecision);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('performs optimistic update on cache', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    const { wrapper, queryClient } = createWrapperWithDecision(mockDecision);
    vi.mocked(decisionsRepo.update).mockResolvedValue({
      ...mockDecision,
      constraints: [{ type: 'volume' }],
    });

    const { result } = renderHook(() => useUpdateConstraints(), { wrapper });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'volume' }],
        context: 'New context',
      });
    });

    // Check optimistic update was applied
    const cachedDecision = queryClient.getQueryData<Decision>(
      queryKeys.decisions.byQuestion('q-1')
    );
    expect(cachedDecision?.constraints).toEqual([{ type: 'volume' }]);
  });

  it('rolls back on error', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    const { wrapper, queryClient } = createWrapperWithDecision(mockDecision);
    vi.mocked(decisionsRepo.update).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useUpdateConstraints(), { wrapper });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'volume' }],
      });
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // Check rollback was applied
    const cachedDecision = queryClient.getQueryData<Decision>(
      queryKeys.decisions.byQuestion('q-1')
    );
    expect(cachedDecision?.constraints).toEqual([{ type: 'price' }]);
  });

  it('handles context as undefined', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.update).mockResolvedValue(mockDecision);

    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'price' }],
        // context is undefined
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.update).toHaveBeenCalledWith('decision-1', {
      constraints: [{ type: 'price' }],
      constraint_context: null,
    });
  });

  it('resets mutation state', async () => {
    const { decisionsRepo } = await import('@/lib/repositories/decisions');
    vi.mocked(decisionsRepo.update).mockResolvedValue(mockDecision);

    const { result } = renderHook(() => useUpdateConstraints(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.updateConstraints({
        decisionId: 'decision-1',
        questionId: 'q-1',
        constraints: [{ type: 'price' }],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
    });
    expect(result.current.error).toBeNull();
  });
});
