import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { evidenceRepo } from '@/lib/repositories/evidence';

import { useEvidence } from './useEvidence';

// Mock repository
vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    getByQuestionId: vi.fn(),
  },
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useEvidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches evidence for a question', async () => {
    const mockEvidence = [
      {
        id: 'e1',
        question_id: 'q1',
        title: 'Source 1',
        url: 'https://example.com',
        section_anchor: null,
        excerpt: null,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    vi.mocked(evidenceRepo.getByQuestionId).mockResolvedValueOnce(mockEvidence);

    const { result } = renderHook(() => useEvidence('q1'), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockEvidence);
    expect(evidenceRepo.getByQuestionId).toHaveBeenCalledWith('q1');
  });

  it('does not fetch when questionId is empty', () => {
    const { result } = renderHook(() => useEvidence(''), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(evidenceRepo.getByQuestionId).not.toHaveBeenCalled();
  });

  it('handles errors', async () => {
    vi.mocked(evidenceRepo.getByQuestionId).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => useEvidence('q1'), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Database error');
  });
});
