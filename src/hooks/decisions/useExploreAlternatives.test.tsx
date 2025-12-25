import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

import { useExploreAlternatives } from './useExploreAlternatives';

import type { ExploreAlternativesResult } from './useExploreAlternatives';

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
  decision_type: 'explore_alternatives' as const,
  created_by: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  constraints: null,
  constraint_context: null,
  reasoning: 'I want to see pricing alternatives',
  incorporated_at: null,
};

const mockQuestion = {
  id: 'q-1',
  title: 'Test Question',
  description: null,
  category: 'market' as const,
  status: 'exploring_alternatives' as const,
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

describe('useExploreAlternatives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates decision with reasoning and updates question status', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: 'I want to see pricing alternatives',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.create).toHaveBeenCalledWith({
      question_id: 'q-1',
      decision_type: 'explore_alternatives',
      reasoning: 'I want to see pricing alternatives',
      created_by: 'user-123',
    });

    expect(questionsRepo.updateStatus).toHaveBeenCalledWith(
      'q-1',
      'exploring_alternatives'
    );
    expect(result.current.decisionId).toBe('decision-1');
  });

  it('returns isPending true while mutation is in progress', async () => {
    // Never resolve to keep pending
    vi.mocked(decisionsRepo.create).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: 'Some concern',
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
  });

  it('sets error on mutation failure', async () => {
    const error = new Error('Network error');
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: 'Some reasoning',
      });
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

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: 'Some reasoning',
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
    expect(result.current.decisionId).toBeNull();
  });

  it('exploreAlternativesAsync returns decision result', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: createWrapper(),
    });

    let exploreResult: ExploreAlternativesResult | undefined;

    await act(async () => {
      exploreResult = await result.current.exploreAlternativesAsync({
        questionId: 'q-1',
        reasoning: 'I have concerns about the price',
      });
    });

    expect(exploreResult).toBeDefined();
    expect(exploreResult!.decision.id).toBe('decision-1');
    expect(exploreResult!.decision.decision_type).toBe('explore_alternatives');
    expect(exploreResult!.question.status).toBe('exploring_alternatives');
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

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: OptimisticWrapper,
    });

    act(() => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: 'Need different options',
      });
    });

    // Optimistic update happens in onMutate
    await waitFor(() => {
      const questions = queryClient.getQueryData<typeof mockQuestion[]>(
        queryKeys.questions.all
      );
      expect(questions?.[0].status).toBe('exploring_alternatives');
    });
  });

  it('rolls back on error', async () => {
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce(
      new Error('API Error')
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(queryKeys.questions.all, [
      { ...mockQuestion, id: 'q-1', status: 'ready_for_kel' },
    ]);

    function RollbackWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: RollbackWrapper,
    });

    await act(async () => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: 'This will fail',
      });
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Status should be rolled back
    const questions = queryClient.getQueryData<typeof mockQuestion[]>(
      queryKeys.questions.all
    );
    expect(questions?.[0].status).toBe('ready_for_kel');
  });

  it('saves reasoning text correctly', async () => {
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.updateStatus).mockResolvedValueOnce(mockQuestion);

    const { result } = renderHook(() => useExploreAlternatives(), {
      wrapper: createWrapper(),
    });

    const longReasoning =
      'I am concerned about the pricing strategy. The recommended approach may not align with our target market segment. Could we explore lower price point alternatives?';

    await act(async () => {
      result.current.exploreAlternatives({
        questionId: 'q-1',
        reasoning: longReasoning,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reasoning: longReasoning,
      })
    );
  });
});
