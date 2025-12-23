import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useUpdateQuestion } from './useUpdateQuestion';

// Mock dependencies
const mockUpdate = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    update: (...args: unknown[]) => mockUpdate(...args),
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

describe('useUpdateQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mutation function and isPending state', () => {
    const { result } = renderHook(() => useUpdateQuestion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('calls questionsRepo.update on mutate', async () => {
    const mockQuestion = {
      id: 'q-123',
      title: 'Test Question',
      recommendation: 'New recommendation',
      category: 'product',
      status: 'draft',
      created_by: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockUpdate.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useUpdateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'q-123',
      updates: { recommendation: 'New recommendation' },
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('q-123', {
        recommendation: 'New recommendation',
      });
    });
  });

  it('shows success toast for recommendation update', async () => {
    mockUpdate.mockResolvedValue({
      id: 'q-123',
      recommendation: 'New rec',
    });

    const { result } = renderHook(() => useUpdateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'q-123',
      updates: { recommendation: 'New rec' },
    });

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Recommendation added');
    });
  });

  it('shows category-specific success toast for category update', async () => {
    mockUpdate.mockResolvedValue({
      id: 'q-123',
      category: 'distribution',
    });

    const { result } = renderHook(() => useUpdateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'q-123',
      updates: { category: 'distribution' },
    });

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Category updated to distribution'
      );
    });
  });

  it('shows generic success toast for other updates', async () => {
    mockUpdate.mockResolvedValue({
      id: 'q-123',
      title: 'Updated title',
    });

    const { result } = renderHook(() => useUpdateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'q-123',
      updates: { title: 'Updated title' },
    });

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Question updated');
    });
  });

  it('shows error toast on failure', async () => {
    mockUpdate.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'q-123',
      updates: { recommendation: 'New rec' },
    });

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update question', {
        description: 'Update failed',
      });
    });
  });
});
