import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock repository
vi.mock('@/lib/repositories', () => ({
  pitchDraftsRepo: {
    getAll: vi.fn(),
  },
}));

import { pitchDraftsRepo } from '@/lib/repositories';

import { usePitchDrafts } from './usePitchDrafts';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('usePitchDrafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all pitch drafts', async () => {
    const mockDrafts = [
      { id: 'd1', title: 'Draft 1', status: 'draft' },
      { id: 'd2', title: 'Draft 2', status: 'ready' },
    ];
    vi.mocked(pitchDraftsRepo.getAll).mockResolvedValueOnce(mockDrafts as never);

    const { result } = renderHook(() => usePitchDrafts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDrafts);
    expect(pitchDraftsRepo.getAll).toHaveBeenCalled();
  });

  it('returns empty array when no drafts', async () => {
    vi.mocked(pitchDraftsRepo.getAll).mockResolvedValueOnce([]);

    const { result } = renderHook(() => usePitchDrafts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles errors', async () => {
    vi.mocked(pitchDraftsRepo.getAll).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => usePitchDrafts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Database error');
  });
});
