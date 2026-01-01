import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useMarkQuestionCurrent } from './useMarkQuestionCurrent';

// Mock dependencies
const mockTouchUpdatedAt = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    touchUpdatedAt: (...args: unknown[]) => mockTouchUpdatedAt(...args),
  },
}));

// Mock sonner toast
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

describe('useMarkQuestionCurrent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mutation function and isPending state', () => {
    const { result } = renderHook(() => useMarkQuestionCurrent(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('calls questionsRepo.touchUpdatedAt on mutate', async () => {
    const mockQuestion = {
      id: 'q-123',
      title: 'Test Question',
      category: 'product',
      status: 'draft',
      created_by: 'user-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    };
    mockTouchUpdatedAt.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useMarkQuestionCurrent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(mockTouchUpdatedAt).toHaveBeenCalledWith('q-123');
    });
  });

  it('shows success toast on successful mutation', async () => {
    const mockQuestion = {
      id: 'q-123',
      title: 'Test Question',
      updated_at: new Date().toISOString(),
    };
    mockTouchUpdatedAt.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useMarkQuestionCurrent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Data marked as current');
    });
  });

  it('shows error toast on failure', async () => {
    mockTouchUpdatedAt.mockRejectedValue(new Error('Failed to touch'));

    const { result } = renderHook(() => useMarkQuestionCurrent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update timestamp', {
        description: 'Failed to touch',
      });
    });
  });

  it('sets isPending to true during mutation', async () => {
    // Create a deferred promise to control timing
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockTouchUpdatedAt.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useMarkQuestionCurrent(), {
      wrapper: createWrapper(),
    });

    // Initially not pending
    expect(result.current.isPending).toBe(false);

    // Start mutation
    result.current.mutate('q-123');

    // Should be pending
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Resolve the promise
    resolvePromise!({ id: 'q-123', updated_at: new Date().toISOString() });

    // Should no longer be pending
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
