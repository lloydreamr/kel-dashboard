import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useQuestions } from './useQuestions';

// Mock dependencies
const mockGetAll = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    getAll: () => mockGetAll(),
  },
}));

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

describe('useQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns query result with data, isLoading, and error', () => {
    mockGetAll.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('calls questionsRepo.getAll and returns questions array', async () => {
    const mockQuestions = [
      {
        id: 'q-1',
        title: 'Question 1',
        category: 'product',
        status: 'draft',
        created_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'q-2',
        title: 'Question 2',
        category: 'pricing',
        status: 'ready_for_kel',
        created_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    mockGetAll.mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetAll).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockQuestions);
    expect(result.current.data).toHaveLength(2);
  });

  it('returns empty array when no questions exist', async () => {
    mockGetAll.mockResolvedValue([]);

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles error from repository', async () => {
    const error = new Error('Failed to fetch questions');
    mockGetAll.mockRejectedValue(error);

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
