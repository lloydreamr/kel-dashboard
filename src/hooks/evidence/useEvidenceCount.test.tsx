import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { evidenceRepo } from '@/lib/repositories/evidence';

import { useEvidenceCount } from './useEvidenceCount';

// Mock repository
vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    countByQuestionId: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useEvidenceCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns evidence count for question', async () => {
    vi.mocked(evidenceRepo.countByQuestionId).mockResolvedValueOnce(5);

    const { result } = renderHook(() => useEvidenceCount('q-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(evidenceRepo.countByQuestionId).toHaveBeenCalledWith('q-1');
    expect(result.current.count).toBe(5);
  });

  it('returns 0 when no evidence', async () => {
    vi.mocked(evidenceRepo.countByQuestionId).mockResolvedValueOnce(0);

    const { result } = renderHook(() => useEvidenceCount('q-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(0);
  });

  it('returns 0 while loading', () => {
    vi.mocked(evidenceRepo.countByQuestionId).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useEvidenceCount('q-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.count).toBe(0);
  });

  it('handles errors', async () => {
    vi.mocked(evidenceRepo.countByQuestionId).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => useEvidenceCount('q-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Database error');
    expect(result.current.count).toBe(0);
  });
});
