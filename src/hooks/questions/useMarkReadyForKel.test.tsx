import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useMarkReadyForKel } from './useMarkReadyForKel';

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    update: vi.fn(),
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

describe('useMarkReadyForKel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns markReadyForKel function', () => {
    const { result } = renderHook(() => useMarkReadyForKel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.markReadyForKel).toBeDefined();
    expect(typeof result.current.markReadyForKel).toBe('function');
  });

  it('calls update with ready_for_kel status for draft questions', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.update).mockResolvedValue({
      id: 'q-123',
      status: 'ready_for_kel',
    } as never);

    const { result } = renderHook(() => useMarkReadyForKel(), {
      wrapper: createWrapper(),
    });

    result.current.markReadyForKel('q-123', 'draft');

    await waitFor(() => {
      expect(questionsRepo.update).toHaveBeenCalledWith('q-123', {
        status: 'ready_for_kel',
      });
    });
  });

  it('shows error toast for ready_for_kel questions', async () => {
    const { toast } = await import('sonner');

    const { result } = renderHook(() => useMarkReadyForKel(), {
      wrapper: createWrapper(),
    });

    result.current.markReadyForKel('q-123', 'ready_for_kel');

    expect(toast.error).toHaveBeenCalledWith('Cannot send to Kel', {
      description: 'Question is already sent to Kel',
    });
  });

  it('shows error toast for non-draft status', async () => {
    const { toast } = await import('sonner');

    const { result } = renderHook(() => useMarkReadyForKel(), {
      wrapper: createWrapper(),
    });

    result.current.markReadyForKel('q-123', 'approved');

    expect(toast.error).toHaveBeenCalledWith('Cannot send to Kel', {
      description: 'Question must be in draft status (current: approved)',
    });
  });

  it('shows success toast on successful update', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    const { toast } = await import('sonner');
    vi.mocked(questionsRepo.update).mockResolvedValue({
      id: 'q-123',
      status: 'ready_for_kel',
    } as never);

    const { result } = renderHook(() => useMarkReadyForKel(), {
      wrapper: createWrapper(),
    });

    result.current.markReadyForKel('q-123', 'draft');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Question sent to Kel');
    });
  });

  it('calls onSuccess callback after successful update', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.update).mockResolvedValue({
      id: 'q-123',
      status: 'ready_for_kel',
    } as never);

    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => useMarkReadyForKel(), {
      wrapper: createWrapper(),
    });

    result.current.markReadyForKel('q-123', 'draft', {
      onSuccess: mockOnSuccess,
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
