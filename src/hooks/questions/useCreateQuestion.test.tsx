import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCreateQuestion } from './useCreateQuestion';

// Mock dependencies
const mockCreate = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

describe('useCreateQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mutation function and isPending state', () => {
    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('calls questionsRepo.create on mutate', async () => {
    const mockQuestion = {
      id: 'q-123',
      title: 'Test Question',
      category: 'product',
      status: 'draft',
      created_by: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCreate.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test Question',
      category: 'product',
      created_by: 'user-123',
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'Test Question',
        category: 'product',
        created_by: 'user-123',
      });
    });
  });

  it('shows success toast on successful creation', async () => {
    mockCreate.mockResolvedValue({
      id: 'q-123',
      title: 'Test',
    });

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test',
      category: 'product',
      created_by: 'user-123',
    });

    // Import the mocked module to check calls
    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Question created');
    });
  });

  it('navigates to question detail page on success', async () => {
    mockCreate.mockResolvedValue({
      id: 'q-123',
      title: 'Test',
    });

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test',
      category: 'product',
      created_by: 'user-123',
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/questions/q-123');
    });
  });

  it('shows error toast on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test',
      category: 'product',
      created_by: 'user-123',
    });

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to create question',
        expect.objectContaining({
          description: 'Database error',
        })
      );
    });
  });

  it('does not navigate on error', async () => {
    mockCreate.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test',
      category: 'product',
      created_by: 'user-123',
    });

    const { toast } = await import('sonner');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  // BUG-009: Mount-state aware navigation tests
  describe('mount-state aware navigation (BUG-009)', () => {
    // Time for React Query's async onMutate (cancelQueries) to settle before mutationFn starts
    const MUTATION_SETTLE_MS = 10;

    it('does not navigate when component unmounts before success', async () => {
      // Arrange - Create a delayed mutation that we can control
      let resolveCreate: (value: unknown) => void;
      mockCreate.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          })
      );

      const { result, unmount } = renderHook(() => useCreateQuestion(), {
        wrapper: createWrapper(),
      });

      // Act - Start mutation
      result.current.mutate({
        title: 'Test',
        category: 'product',
        created_by: 'user-123',
      });

      // Wait for onMutate (which has async operations) to complete and mutationFn to start
      await new Promise((resolve) => setTimeout(resolve, MUTATION_SETTLE_MS));

      // Unmount before mutation completes (simulates user navigating away)
      unmount();

      // Now resolve the mutation
      resolveCreate!({ id: 'q-123', title: 'Test' });

      // Wait a tick for callbacks to fire
      await new Promise((resolve) => setTimeout(resolve, MUTATION_SETTLE_MS));

      // Assert - Navigation should NOT have happened (component unmounted)
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('still shows toast when unmounted', async () => {
      // Arrange
      let resolveCreate: (value: unknown) => void;
      mockCreate.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          })
      );

      const { result, unmount } = renderHook(() => useCreateQuestion(), {
        wrapper: createWrapper(),
      });

      // Act
      result.current.mutate({
        title: 'Test',
        category: 'product',
        created_by: 'user-123',
      });

      // Wait for onMutate (which has async operations) to complete and mutationFn to start
      await new Promise((resolve) => setTimeout(resolve, MUTATION_SETTLE_MS));

      unmount();
      resolveCreate!({ id: 'q-123', title: 'Test' });

      const { toast } = await import('sonner');

      // Wait for callbacks
      await new Promise((resolve) => setTimeout(resolve, MUTATION_SETTLE_MS));

      // Assert - Toast should still show (feedback is important even if navigated away)
      expect(toast.success).toHaveBeenCalledWith('Question created');
    });

    it('navigates when component stays mounted (regression test)', async () => {
      // Arrange
      mockCreate.mockResolvedValue({ id: 'q-123', title: 'Test' });

      const { result } = renderHook(() => useCreateQuestion(), {
        wrapper: createWrapper(),
      });

      // Act - do NOT unmount
      result.current.mutate({
        title: 'Test',
        category: 'product',
        created_by: 'user-123',
      });

      // Assert - Should navigate normally when staying on page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/questions/q-123');
      });
    });
  });
});
