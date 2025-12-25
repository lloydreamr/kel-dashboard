import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

import { useUndoDecision } from './useUndoDecision';

// Mock repositories
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    update: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useUndoDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('undoes decision successfully', async () => {
    vi.mocked(decisionsRepo.delete).mockResolvedValueOnce(undefined);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const { result } = renderHook(() => useUndoDecision(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      decisionId: 'd1',
      questionId: 'q1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.delete).toHaveBeenCalledWith('d1');
    expect(questionsRepo.update).toHaveBeenCalledWith('q1', {
      status: 'ready_for_kel',
    });
    expect(toast.success).toHaveBeenCalledWith('Decision undone');
  });

  it('returns decisionId and questionId on success', async () => {
    vi.mocked(decisionsRepo.delete).mockResolvedValueOnce(undefined);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const { result } = renderHook(() => useUndoDecision(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      decisionId: 'd1',
      questionId: 'q1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      decisionId: 'd1',
      questionId: 'q1',
    });
  });

  it('shows error toast on delete failure', async () => {
    vi.mocked(decisionsRepo.delete).mockRejectedValueOnce(
      new Error('Delete failed')
    );

    const { result } = renderHook(() => useUndoDecision(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      decisionId: 'd1',
      questionId: 'q1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to undo decision', {
      description: 'Delete failed',
    });
  });

  it('shows error toast on status update failure', async () => {
    vi.mocked(decisionsRepo.delete).mockResolvedValueOnce(undefined);
    vi.mocked(questionsRepo.update).mockRejectedValueOnce(
      new Error('Update failed')
    );

    const { result } = renderHook(() => useUndoDecision(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      decisionId: 'd1',
      questionId: 'q1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to undo decision', {
      description: 'Update failed',
    });
  });

  it('handles non-Error objects in error handler', async () => {
    vi.mocked(decisionsRepo.delete).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useUndoDecision(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      decisionId: 'd1',
      questionId: 'q1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to undo decision', {
      description: 'Unknown error',
    });
  });

  it('invalidates questions.all cache on success (card reappearance)', async () => {
    vi.mocked(decisionsRepo.delete).mockResolvedValueOnce(undefined);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Seed the cache with questions including our target question in "approved" state
    const mockQuestions = [
      { id: 'q1', status: 'approved', title: 'Test Question 1' },
      { id: 'q2', status: 'ready_for_kel', title: 'Test Question 2' },
    ];
    queryClient.setQueryData(queryKeys.questions.all, mockQuestions);

    // Track cache invalidations
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUndoDecision(), { wrapper });

    await act(async () => {
      result.current.mutate({
        decisionId: 'd1',
        questionId: 'q1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify questions.all is invalidated - this triggers card reappearance
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.questions.all,
    });

    invalidateSpy.mockRestore();
  });

  it('invalidates question detail and decisions caches on success', async () => {
    vi.mocked(decisionsRepo.delete).mockResolvedValueOnce(undefined);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUndoDecision(), { wrapper });

    await act(async () => {
      result.current.mutate({
        decisionId: 'd1',
        questionId: 'q1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify all related caches are invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.decisions.byQuestion('q1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.questions.detail('q1'),
    });

    invalidateSpy.mockRestore();
  });

  // E2E-ready test: verifies the complete undo flow updates question status
  it('[E2E-ready] reverts question status to ready_for_kel after undo', async () => {
    vi.mocked(decisionsRepo.delete).mockResolvedValueOnce(undefined);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({
      id: 'q1',
      status: 'ready_for_kel',
      title: 'Test Question',
    } as never);

    const { result } = renderHook(() => useUndoDecision(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        decisionId: 'd1',
        questionId: 'q1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the update call sets status back to ready_for_kel
    // In E2E: after undo, card should reappear in queue with status 'ready_for_kel'
    expect(questionsRepo.update).toHaveBeenCalledWith('q1', {
      status: 'ready_for_kel',
    });
    expect(toast.success).toHaveBeenCalledWith('Decision undone');
  });
});
