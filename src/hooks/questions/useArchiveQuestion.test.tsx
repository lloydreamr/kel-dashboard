import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useArchiveQuestion } from './useArchiveQuestion';
import { createMockQuestion } from '@/test/factories';

// Use factory for archived question mock
const mockQuestion = createMockQuestion({
  id: 'q-123',
  status: 'archived',
});

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    archive: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('useArchiveQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns archive mutation function', () => {
    const { result } = renderHook(() => useArchiveQuestion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('calls archive with question id', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.archive).mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useArchiveQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(questionsRepo.archive).toHaveBeenCalledWith('q-123');
    });
  });

  it('shows success toast on successful archive', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    const { toast } = await import('sonner');
    vi.mocked(questionsRepo.archive).mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useArchiveQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Question archived');
    });
  });

  it('shows error toast on failure', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    const { toast } = await import('sonner');
    vi.mocked(questionsRepo.archive).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useArchiveQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to archive question', {
        description: 'Failed',
      });
    });
  });

  it('calls onSuccess callback after successful archive', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.archive).mockResolvedValue(mockQuestion);

    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => useArchiveQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123', { onSuccess: mockOnSuccess });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
