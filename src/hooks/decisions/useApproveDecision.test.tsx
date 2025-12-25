import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

import { useApproveDecision } from './useApproveDecision';

import type { ApproveDecisionResult } from './useApproveDecision';

// Mock repositories
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    create: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    updateStatus: vi.fn(),
  },
}));

// Mock useProfile
vi.mock('@/hooks/auth', () => ({
  useProfile: () => ({
    data: { id: 'user-123', role: 'kel' },
    isLoading: false,
  }),
}));

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

const mockQuestion = {
  id: 'q-1',
  title: 'Test Question',
  description: null,
  category: 'market' as const,
  status: 'approved' as const,
  recommendation: 'Test recommendation',
  recommendation_rationale: null,
  created_by: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  viewed_by_kel_at: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Pre-populate with questions data
  queryClient.setQueryData(queryKeys.questions.all, [
    { ...mockQuestion, status: 'ready_for_kel' },
  ]);

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useApproveDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates decision and updates question status on approve', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const { result } = renderHook(() => useApproveDecision(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.approve({ questionId: 'q-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.create).toHaveBeenCalledWith({
      question_id: 'q-1',
      decision_type: 'approved',
      created_by: 'user-123',
    });

    expect(questionsRepo.updateStatus).toHaveBeenCalledWith('q-1', 'approved');
    expect(result.current.decisionId).toBe('decision-1');
  });

  it('returns isPending true while mutation is in progress', async () => {
    // Never resolve to keep pending
    vi.mocked(decisionsRepo.create).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useApproveDecision(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.approve({ questionId: 'q-1' });
    });

    // Need to wait for React to process the mutation start
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
  });

  it('sets error on mutation failure', async () => {
    const error = new Error('Network error');
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useApproveDecision(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.approve({ questionId: 'q-1' });
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.isSuccess).toBe(false);
  });

  it('resets mutation state', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const { result } = renderHook(() => useApproveDecision(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.approve({ questionId: 'q-1' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    // Wait for reset to take effect
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
    });
    expect(result.current.decisionId).toBeNull();
  });

  it('approveAsync returns decision result', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const { result } = renderHook(() => useApproveDecision(), {
      wrapper: createWrapper(),
    });

    let approveResult: ApproveDecisionResult | undefined;

    await act(async () => {
      approveResult = await result.current.approveAsync({ questionId: 'q-1' });
    });

    expect(approveResult).toBeDefined();
    expect(approveResult!.decision.id).toBe('decision-1');
    expect(approveResult!.question.status).toBe('approved');
  });

  it('performs optimistic update on question status', async () => {
    // Slow mutation to observe optimistic update
    vi.mocked(decisionsRepo.create).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockDecision), 100);
        })
    );
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(queryKeys.questions.all, [
      { ...mockQuestion, id: 'q-1', status: 'ready_for_kel' },
    ]);

    function OptimisticWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useApproveDecision(), {
      wrapper: OptimisticWrapper,
    });

    act(() => {
      result.current.approve({ questionId: 'q-1' });
    });

    // Optimistic update happens in onMutate which runs asynchronously
    await waitFor(() => {
      const questions = queryClient.getQueryData<typeof mockQuestion[]>(
        queryKeys.questions.all
      );
      expect(questions?.[0].status).toBe('approved');
    });
  });
});
