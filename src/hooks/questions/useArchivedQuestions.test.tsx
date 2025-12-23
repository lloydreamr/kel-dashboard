import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useArchivedQuestions } from './useArchivedQuestions';

import type { Question } from '@/types/database';

const mockArchivedQuestions: Question[] = [
  {
    id: 'arch-1',
    title: 'Archived Question 1',
    description: null,
    category: 'market',
    recommendation: null,
    recommendation_rationale: null,
    status: 'archived',
    created_by: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    viewed_by_kel_at: null,
  },
  {
    id: 'arch-2',
    title: 'Archived Question 2',
    description: null,
    category: 'product',
    recommendation: null,
    recommendation_rationale: null,
    status: 'archived',
    created_by: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
    viewed_by_kel_at: null,
  },
];

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    getArchived: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return TestWrapper;
}

describe('useArchivedQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches archived questions successfully', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.getArchived).mockResolvedValue(mockArchivedQuestions);

    const { result } = renderHook(() => useArchivedQuestions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockArchivedQuestions);
    expect(questionsRepo.getArchived).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no archived questions', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.getArchived).mockResolvedValue([]);

    const { result } = renderHook(() => useArchivedQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles errors', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.getArchived).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useArchivedQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
