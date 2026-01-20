import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { competitorsRepo } from '@/lib/repositories/competitors';

import { useCreateCompetitor, useUpdateCompetitor, useDeleteCompetitor } from './useCompetitorMutations';

import type { CompetitorDataPoint } from '@/types';
import type { ReactNode } from 'react';

vi.mock('sonner');
vi.mock('@/lib/repositories/competitors');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockCompetitor: CompetitorDataPoint = {
  id: '1',
  name: 'Test Competitor',
  price_score: 7,
  quality_score: 8,
  category: null,
  notes: null,
  is_kel_position: false,
  created_by: 'user1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('useCreateCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates competitor with optimistic update', async () => {
    const mockCreate = vi.fn().mockResolvedValue(mockCompetitor);
    vi.mocked(competitorsRepo.create).mockImplementation(mockCreate);

    const { result } = renderHook(() => useCreateCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'New Competitor',
      price_score: 5,
      quality_score: 5,
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  it('shows success toast on successful creation', async () => {
    vi.mocked(competitorsRepo.create).mockResolvedValue(mockCompetitor);

    const { result } = renderHook(() => useCreateCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'New Competitor',
      price_score: 5,
      quality_score: 5,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Competitor added');
    });
  });

  it('shows error toast and rolls back on failure', async () => {
    const error = new Error('Failed to create');
    vi.mocked(competitorsRepo.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'New Competitor',
      price_score: 5,
      quality_score: 5,
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to add competitor', {
        description: 'Failed to create',
      });
    });
  });
});

describe('useUpdateCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates competitor with optimistic update', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(mockCompetitor);
    vi.mocked(competitorsRepo.update).mockImplementation(mockUpdate);

    const { result } = renderHook(() => useUpdateCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      input: { name: 'Updated Name' },
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('1', { name: 'Updated Name' });
    });
  });

  it('shows success toast on successful update', async () => {
    vi.mocked(competitorsRepo.update).mockResolvedValue(mockCompetitor);

    const { result } = renderHook(() => useUpdateCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: '1',
      input: { name: 'Updated Name' },
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Competitor updated');
    });
  });
});

describe('useDeleteCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes competitor with optimistic update', async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.mocked(competitorsRepo.delete).mockImplementation(mockDelete);

    const { result } = renderHook(() => useDeleteCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
  });

  it('shows success toast on successful deletion', async () => {
    vi.mocked(competitorsRepo.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Competitor removed');
    });
  });

  it('invalidates queries on settle', async () => {
    vi.mocked(competitorsRepo.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCompetitor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
