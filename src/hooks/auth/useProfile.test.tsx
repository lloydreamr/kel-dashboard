import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { profileQueryKey, useProfile } from './useProfile';

import type { Profile } from '@/types/database';

// Mock dependencies
const mockGetCurrent = vi.fn();
vi.mock('@/lib/repositories/profiles', () => ({
  profilesRepo: {
    getCurrent: () => mockGetCurrent(),
  },
}));

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

const mockProfile: Profile = {
  id: 'user-123',
  email: 'maho@example.com',
  role: 'maho',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports correct query key', () => {
    expect(profileQueryKey).toEqual(['profile']);
  });

  it('returns query result with data, isLoading, and error', () => {
    mockGetCurrent.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('calls profilesRepo.getCurrent and returns profile', async () => {
    mockGetCurrent.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetCurrent).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockProfile);
    expect(result.current.data?.role).toBe('maho');
  });

  it('returns null when no profile exists', async () => {
    mockGetCurrent.mockResolvedValue(null);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('returns profile with kel role', async () => {
    const kelProfile: Profile = {
      ...mockProfile,
      id: 'kel-123',
      email: 'kel@example.com',
      role: 'kel',
    };
    mockGetCurrent.mockResolvedValue(kelProfile);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.role).toBe('kel');
  });

  it('handles error from repository', async () => {
    const error = new Error('Failed to fetch profile');
    mockGetCurrent.mockRejectedValue(error);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
