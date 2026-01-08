/**
 * useSyncOnQuerySuccess Hook Tests
 *
 * Tests for automatic sync timestamp updates on query success.
 * Story 10.4: Offline Detection & Sync Indicator (Task 6)
 */

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as features from '@/lib/features';

import { useSyncOnQuerySuccess } from './useSyncOnQuerySuccess';

import type { ReactNode } from 'react';


// Mock features
vi.mock('@/lib/features', () => ({
  FEATURES: {
    OFFLINE_READ: true,
    OFFLINE_MODE: false,
  },
}));

// Mock useSyncStatus
const mockUpdateSyncTime = vi.fn();
vi.mock('./useSyncStatus', () => ({
  useSyncStatus: () => ({
    lastSync: new Date(),
    syncState: 'fresh',
    timeSinceSync: 'just now',
    updateSyncTime: mockUpdateSyncTime,
  }),
}));

describe('useSyncOnQuerySuccess', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(features.FEATURES).OFFLINE_READ = true;
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('updates sync time when a query succeeds', async () => {
    // Set up a test query that will succeed
    const testQueryFn = vi.fn().mockResolvedValue({ data: 'test' });

    // Render the hook
    renderHook(() => useSyncOnQuerySuccess(), { wrapper });

    // Trigger a query
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-query'],
          queryFn: testQueryFn,
        }),
      { wrapper }
    );

    // Wait for query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Wait for the sync time update (may need a small delay for event propagation)
    await waitFor(() => {
      expect(mockUpdateSyncTime).toHaveBeenCalled();
    });
  });

  it('does not update sync time when feature flag is disabled', async () => {
    vi.mocked(features.FEATURES).OFFLINE_READ = false;

    const testQueryFn = vi.fn().mockResolvedValue({ data: 'test' });

    // Render the hook
    renderHook(() => useSyncOnQuerySuccess(), { wrapper });

    // Trigger a query
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-query-disabled'],
          queryFn: testQueryFn,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should NOT have called updateSyncTime
    expect(mockUpdateSyncTime).not.toHaveBeenCalled();
  });

  it('does not update sync time when query fails', async () => {
    const testQueryFn = vi.fn().mockRejectedValue(new Error('Failed'));

    // Render the hook
    renderHook(() => useSyncOnQuerySuccess(), { wrapper });

    // Trigger a failing query
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-query-fail'],
          queryFn: testQueryFn,
          retry: false,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should NOT have called updateSyncTime
    expect(mockUpdateSyncTime).not.toHaveBeenCalled();
  });

  it('unsubscribes from cache events on unmount', async () => {
    const testQueryFn = vi.fn().mockResolvedValue({ data: 'test' });

    // Render and unmount the hook
    const { unmount } = renderHook(() => useSyncOnQuerySuccess(), { wrapper });
    unmount();

    // Clear the mock to track only new calls
    mockUpdateSyncTime.mockClear();

    // Trigger a query after unmount
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['test-query-after-unmount'],
          queryFn: testQueryFn,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should NOT have called updateSyncTime since we unsubscribed
    expect(mockUpdateSyncTime).not.toHaveBeenCalled();
  });
});
