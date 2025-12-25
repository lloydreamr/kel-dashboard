import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import { useUpdateEvidence } from './useUpdateEvidence';

import type { Evidence } from '@/types/evidence';
import type { ReactNode } from 'react';

vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    update: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockEvidence: Evidence = {
  id: 'e1',
  question_id: 'q1',
  title: 'Original Title',
  url: 'https://example.com',
  section_anchor: null,
  excerpt: null,
  created_by: 'user1',
  created_at: '2024-12-24T00:00:00Z',
};

describe('useUpdateEvidence', () => {
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

    // Seed cache with existing evidence
    queryClient.setQueryData(queryKeys.evidence.byQuestion('q1'), [mockEvidence]);
  });

  it('calls evidenceRepo.update with correct arguments', async () => {
    vi.mocked(evidenceRepo.update).mockResolvedValue({
      ...mockEvidence,
      title: 'Updated Title',
    });

    const { result } = renderHook(() => useUpdateEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'e1', updates: { title: 'Updated Title' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(evidenceRepo.update).toHaveBeenCalledWith('e1', { title: 'Updated Title' });
  });

  it('optimistically updates cache', async () => {
    vi.mocked(evidenceRepo.update).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ...mockEvidence, title: 'Updated' }), 100))
    );

    const { result } = renderHook(() => useUpdateEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'e1', updates: { title: 'Updated' } });
    });

    // Check optimistic update before resolution
    const cached = queryClient.getQueryData<Evidence[]>(queryKeys.evidence.byQuestion('q1'));
    expect(cached?.[0]?.title).toBe('Updated');
  });

  it('rolls back on error', async () => {
    vi.mocked(evidenceRepo.update).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'e1', updates: { title: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should rollback to original
    const cached = queryClient.getQueryData<Evidence[]>(queryKeys.evidence.byQuestion('q1'));
    expect(cached?.[0]?.title).toBe('Original Title');
  });

  it('shows error toast on failure', async () => {
    vi.mocked(evidenceRepo.update).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useUpdateEvidence('q1'), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'e1', updates: { title: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith('Failed to update evidence', {
      description: 'Database error',
    });
  });
});
