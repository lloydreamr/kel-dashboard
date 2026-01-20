import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock repository
vi.mock('@/lib/repositories', () => ({
  pitchDraftsRepo: {
    getById: vi.fn(),
  },
}));

import { pitchDraftsRepo } from '@/lib/repositories';

import { usePitchDraft } from './usePitchDraft';

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

describe('usePitchDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches pitch draft by ID', async () => {
    const mockDraft = {
      id: 'd1',
      title: 'Test Draft',
      status: 'draft',
    };
    vi.mocked(pitchDraftsRepo.getById).mockResolvedValueOnce(mockDraft as never);

    const { result } = renderHook(() => usePitchDraft('d1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDraft);
    expect(pitchDraftsRepo.getById).toHaveBeenCalledWith('d1');
  });

  it('does not fetch when ID is empty', () => {
    const { result } = renderHook(() => usePitchDraft(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(pitchDraftsRepo.getById).not.toHaveBeenCalled();
  });

  it('handles errors', async () => {
    vi.mocked(pitchDraftsRepo.getById).mockRejectedValueOnce(
      new Error('Draft not found')
    );

    const { result } = renderHook(() => usePitchDraft('invalid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Draft not found');
  });
});
