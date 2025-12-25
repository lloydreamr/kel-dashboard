import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';


// Mock repository
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    getByQuestionId: vi.fn(),
  },
}));

import { decisionsRepo } from '@/lib/repositories/decisions';

import { useDecision } from './useDecision';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches decision for a question', async () => {
    const mockDecision = {
      id: 'd1',
      question_id: 'q1',
      decision_type: 'approved',
    };
    vi.mocked(decisionsRepo.getByQuestionId).mockResolvedValueOnce(
      mockDecision as never
    );

    const { result } = renderHook(() => useDecision('q1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDecision);
    expect(decisionsRepo.getByQuestionId).toHaveBeenCalledWith('q1');
  });

  it('returns null when no decision exists', async () => {
    vi.mocked(decisionsRepo.getByQuestionId).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useDecision('q1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
  });

  it('does not fetch when questionId is empty', () => {
    const { result } = renderHook(() => useDecision(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(decisionsRepo.getByQuestionId).not.toHaveBeenCalled();
  });

  it('handles errors', async () => {
    vi.mocked(decisionsRepo.getByQuestionId).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => useDecision('q1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Database error');
  });
});
