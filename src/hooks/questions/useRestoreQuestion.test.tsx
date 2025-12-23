import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRestoreQuestion } from './useRestoreQuestion';

import type { Question } from '@/types/database';

const mockQuestion: Question = {
  id: 'q-123',
  title: 'Test Question',
  description: null,
  category: 'market',
  recommendation: null,
  recommendation_rationale: null,
  status: 'draft',
  created_by: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  viewed_by_kel_at: null,
};

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    restore: vi.fn(),
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

describe('useRestoreQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns restore mutation function', () => {
    const { result } = renderHook(() => useRestoreQuestion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('calls restore with question id', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.restore).mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useRestoreQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(questionsRepo.restore).toHaveBeenCalledWith('q-123');
    });
  });

  it('shows success toast on successful restore', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    const { toast } = await import('sonner');
    vi.mocked(questionsRepo.restore).mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useRestoreQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Question restored');
    });
  });

  it('shows error toast on failure', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    const { toast } = await import('sonner');
    vi.mocked(questionsRepo.restore).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useRestoreQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to restore question', {
        description: 'Failed',
      });
    });
  });

  it('calls onSuccess callback after successful restore', async () => {
    const { questionsRepo } = await import('@/lib/repositories/questions');
    vi.mocked(questionsRepo.restore).mockResolvedValue(mockQuestion);

    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => useRestoreQuestion(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('q-123', { onSuccess: mockOnSuccess });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
