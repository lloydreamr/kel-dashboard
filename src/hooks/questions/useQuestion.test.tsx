import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useQuestion } from './useQuestion';

// Mock dependencies
const mockGetById = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    getById: (...args: unknown[]) => mockGetById(...args),
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

describe('useQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns query result with data, isLoading, and error', () => {
    mockGetById.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useQuestion('q-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('calls questionsRepo.getById with the question ID', async () => {
    const mockQuestion = {
      id: 'q-123',
      title: 'Test Question',
      category: 'product',
      status: 'draft',
      created_by: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockGetById.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useQuestion('q-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetById).toHaveBeenCalledWith('q-123');
    expect(result.current.data).toEqual(mockQuestion);
  });

  it('does not fetch when ID is empty', () => {
    const { result } = renderHook(() => useQuestion(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetById).not.toHaveBeenCalled();
  });

  it('handles error from repository', async () => {
    const error = new Error('Not found');
    mockGetById.mockRejectedValue(error);

    const { result } = renderHook(() => useQuestion('q-invalid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
