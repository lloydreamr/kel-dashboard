/**
 * useGenerateOpportunities Hook Tests
 *
 * Tests for AI opportunity generation mutation hook.
 * Verifies API call, toast notifications, cooldown, and query invalidation.
 *
 * Story 16-5: Manual Opportunity Refresh
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';

import { useGenerateOpportunities } from './useGenerateOpportunities';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createWrapperWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper: Wrapper, queryClient };
}

describe('useGenerateOpportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Always restore real timers after each test
    vi.useRealTimers();
  });

  it('calls API with regenerate true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, generated: 5, breakdown: {} }),
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: true }),
    });
  });

  it('transitions isPending: false → true → false during mutation', async () => {
    let resolveResponse: (value: Response) => void;
    const responsePromise = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    mockFetch.mockReturnValue(responsePromise);

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    // Initially false
    expect(result.current.isPending).toBe(false);

    // Trigger mutation
    act(() => {
      result.current.mutate();
    });

    // Should be true during mutation
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Resolve the promise
    await act(async () => {
      resolveResponse!({
        ok: true,
        json: () => Promise.resolve({ success: true, generated: 5, breakdown: {} }),
      } as Response);
    });

    // Wait for completion
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return to false
    expect(result.current.isPending).toBe(false);
  });

  it('shows success toast with count and breakdown', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          generated: 8,
          breakdown: { market_gap: 3, product_opportunity: 5 },
        }),
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast.success).toHaveBeenCalledWith('Generated 8 opportunities', {
      description: '3 market gap, 5 product opportunity',
    });
  });

  it('shows error toast with retry action on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Service is busy' }),
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith('Failed to generate opportunities', {
      description: 'Service is busy',
      action: expect.objectContaining({
        label: 'Retry',
        onClick: expect.any(Function),
      }),
    });
  });

  it('activates cooldown after successful generation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, generated: 5, breakdown: {} }),
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    // Initially no cooldown
    expect(result.current.isCooldown).toBe(false);

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cooldown should be active
    expect(result.current.isCooldown).toBe(true);
    expect(result.current.cooldownSeconds).toBe(30);
  });

  it('cooldown decrements by 1 after 1 second', async () => {
    // Use fake timers only for this test
    vi.useFakeTimers();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, generated: 5, breakdown: {} }),
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    // Run mutation and resolve immediately
    await act(async () => {
      result.current.mutate();
    });

    // Flush the mutation promise
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Cooldown should be active
    expect(result.current.isCooldown).toBe(true);
    const initialCooldown = result.current.cooldownSeconds;

    // Advance one second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should have decremented by 1
    expect(result.current.cooldownSeconds).toBe(initialCooldown - 1);
    expect(result.current.isCooldown).toBe(true);
  });

  it('invalidates queries on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, generated: 5, breakdown: {} }),
    });

    const { wrapper, queryClient } = createWrapperWithQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGenerateOpportunities(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.opportunities.all,
    });
  });

  it('gracefully handles localStorage being unavailable', async () => {
    // Simulate localStorage throwing (e.g., Safari private mode)
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage is not available');
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    // Should not throw, lastRefresh should be null
    expect(result.current.lastRefresh).toBeNull();
  });

  it('handles invalid date string in localStorage', async () => {
    // Simulate garbage data in localStorage
    localStorageMock.getItem.mockReturnValue('not-a-valid-date');

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    // Should not throw, lastRefresh should be null due to invalid date
    expect(result.current.lastRefresh).toBeNull();
  });

  it('stores last refresh timestamp in localStorage on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, generated: 5, breakdown: {} }),
    });

    const { result } = renderHook(() => useGenerateOpportunities(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'kel:opportunities:lastRefresh',
      expect.any(String)
    );
    expect(result.current.lastRefresh).not.toBeNull();
  });
});
