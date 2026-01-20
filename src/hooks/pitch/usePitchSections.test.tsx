import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock repository
vi.mock('@/lib/repositories', () => ({
  pitchSectionsRepo: {
    getByDraftId: vi.fn(),
    getByDraftIdWithSources: vi.fn(),
  },
}));

import { pitchSectionsRepo } from '@/lib/repositories';

import { usePitchSections } from './usePitchSections';

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

describe('usePitchSections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches sections without sources by default', async () => {
    const mockSections = [
      { id: 's1', section_type: 'market_opportunity', content: 'Content 1' },
      { id: 's2', section_type: 'competitive_positioning', content: 'Content 2' },
    ];
    vi.mocked(pitchSectionsRepo.getByDraftId).mockResolvedValueOnce(
      mockSections as never
    );

    const { result } = renderHook(() => usePitchSections('d1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSections);
    expect(pitchSectionsRepo.getByDraftId).toHaveBeenCalledWith('d1');
    expect(pitchSectionsRepo.getByDraftIdWithSources).not.toHaveBeenCalled();
  });

  it('fetches sections with sources when option is set', async () => {
    const mockSections = [
      {
        id: 's1',
        section_type: 'market_opportunity',
        content: 'Content 1',
        sources: [{ id: 'src1', source_type: 'company', source_id: 'c1' }],
      },
    ];
    vi.mocked(pitchSectionsRepo.getByDraftIdWithSources).mockResolvedValueOnce(
      mockSections as never
    );

    const { result } = renderHook(
      () => usePitchSections('d1', { withSources: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSections);
    expect(pitchSectionsRepo.getByDraftIdWithSources).toHaveBeenCalledWith('d1');
    expect(pitchSectionsRepo.getByDraftId).not.toHaveBeenCalled();
  });

  it('does not fetch when pitchDraftId is empty', () => {
    const { result } = renderHook(() => usePitchSections(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(pitchSectionsRepo.getByDraftId).not.toHaveBeenCalled();
  });

  it('handles errors', async () => {
    vi.mocked(pitchSectionsRepo.getByDraftId).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => usePitchSections('d1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Database error');
  });
});
