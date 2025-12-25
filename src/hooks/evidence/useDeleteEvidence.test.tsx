import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import { useDeleteEvidence } from './useDeleteEvidence';

import type { Evidence } from '@/types/evidence';
import type { ReactNode } from 'react';

vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    delete: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockEvidence: Evidence[] = [
  {
    id: 'e1',
    question_id: 'q1',
    title: 'Evidence 1',
    url: 'https://example.com/1',
    section_anchor: null,
    excerpt: null,
    created_by: 'user1',
    created_at: '2024-12-24T00:00:00Z',
  },
  {
    id: 'e2',
    question_id: 'q1',
    title: 'Evidence 2',
    url: 'https://example.com/2',
    section_anchor: null,
    excerpt: null,
    created_by: 'user1',
    created_at: '2024-12-24T01:00:00Z',
  },
];

describe('useDeleteEvidence', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Seed cache
    queryClient.setQueryData(queryKeys.evidence.byQuestion('q1'), mockEvidence);
  });

  it('calls evidenceRepo.delete with correct id', async () => {
    vi.mocked(evidenceRepo.delete).mockResolvedValue();

    const { result } = renderHook(() => useDeleteEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate('e1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(evidenceRepo.delete).toHaveBeenCalledWith('e1');
  });

  it('optimistically removes from cache', async () => {
    vi.mocked(evidenceRepo.delete).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useDeleteEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate('e1');
    });

    // Check optimistic removal before resolution
    const cached = queryClient.getQueryData<Evidence[]>(queryKeys.evidence.byQuestion('q1'));
    expect(cached).toHaveLength(1);
    expect(cached?.[0]?.id).toBe('e2');
  });

  it('rolls back on error', async () => {
    vi.mocked(evidenceRepo.delete).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDeleteEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate('e1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should rollback to original 2 items
    const cached = queryClient.getQueryData<Evidence[]>(queryKeys.evidence.byQuestion('q1'));
    expect(cached).toHaveLength(2);
  });

  it('shows error toast on failure', async () => {
    vi.mocked(evidenceRepo.delete).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useDeleteEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate('e1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith('Failed to remove evidence', {
      description: 'Database error',
    });
  });
});
