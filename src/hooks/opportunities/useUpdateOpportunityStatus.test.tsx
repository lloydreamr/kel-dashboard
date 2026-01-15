/**
 * useUpdateOpportunityStatus Hook Tests
 *
 * Tests for opportunity status mutation hook.
 * Verifies status update and markReviewed call when status is 'actionable'.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';

import { useUpdateOpportunityStatus } from './useUpdateOpportunityStatus';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import type { Opportunity } from '@/lib/repositories/opportunities';

// Mock the repository
vi.mock('@/lib/repositories/opportunities', () => ({
  opportunitiesRepo: {
    updateStatus: vi.fn(),
    markReviewed: vi.fn(),
  },
}));

import { opportunitiesRepo } from '@/lib/repositories/opportunities';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
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

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper: TestWrapper, queryClient };
}

const mockOpportunity: Opportunity = {
  id: 'test-opportunity-id',
  title: 'Market Gap in Premium Snacks',
  description: 'There is an opportunity in the premium snack segment',
  category: 'market_gap',
  confidence_score: 0.85,
  status: 'new',
  supporting_evidence: [],
  generated_at: '2024-01-15T10:00:00Z',
  reviewed_at: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

describe('useUpdateOpportunityStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should update status without calling markReviewed for non-actionable status', async () => {
    const updatedOpportunity = { ...mockOpportunity, status: 'reviewing' as const };
    vi.mocked(opportunitiesRepo.updateStatus).mockResolvedValue(updatedOpportunity);

    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'reviewing' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(opportunitiesRepo.updateStatus).toHaveBeenCalledWith(
      'test-opportunity-id',
      'reviewing'
    );
    expect(opportunitiesRepo.markReviewed).not.toHaveBeenCalled();
  });

  it('should call markReviewed when status is actionable', async () => {
    const updatedOpportunity = { ...mockOpportunity, status: 'actionable' as const };
    const reviewedOpportunity = {
      ...updatedOpportunity,
      reviewed_at: '2024-01-15T12:00:00Z',
    };

    vi.mocked(opportunitiesRepo.updateStatus).mockResolvedValue(updatedOpportunity);
    vi.mocked(opportunitiesRepo.markReviewed).mockResolvedValue(reviewedOpportunity);

    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'actionable' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(opportunitiesRepo.updateStatus).toHaveBeenCalledWith(
      'test-opportunity-id',
      'actionable'
    );
    expect(opportunitiesRepo.markReviewed).toHaveBeenCalledWith('test-opportunity-id');
  });

  it('should invalidate queries on success', async () => {
    const updatedOpportunity = { ...mockOpportunity, status: 'reviewing' as const };
    vi.mocked(opportunitiesRepo.updateStatus).mockResolvedValue(updatedOpportunity);

    const { wrapper, queryClient } = createWrapperWithQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateOpportunityStatus(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'reviewing' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.opportunities.all,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.opportunities.byId('test-opportunity-id'),
    });
  });

  it('should handle error correctly', async () => {
    const error = new Error('Failed to update status');
    vi.mocked(opportunitiesRepo.updateStatus).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'actionable' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should set isPending to true during mutation', async () => {
    let resolveUpdate: (value: Opportunity) => void;
    const updatePromise = new Promise<Opportunity>((resolve) => {
      resolveUpdate = resolve;
    });
    vi.mocked(opportunitiesRepo.updateStatus).mockReturnValue(updatePromise);

    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'reviewing' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolveUpdate!({ ...mockOpportunity, status: 'reviewing' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should show toast error when mutation fails', async () => {
    const error = new Error('Network error');
    vi.mocked(opportunitiesRepo.updateStatus).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'actionable' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to update opportunity', {
      description: 'Network error',
    });
  });

  it('should succeed even if markReviewed fails', async () => {
    const updatedOpportunity = { ...mockOpportunity, status: 'actionable' as const };
    vi.mocked(opportunitiesRepo.updateStatus).mockResolvedValue(updatedOpportunity);
    vi.mocked(opportunitiesRepo.markReviewed).mockRejectedValue(
      new Error('Failed to set timestamp')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdateOpportunityStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'test-opportunity-id', status: 'actionable' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Status update should have succeeded
    expect(opportunitiesRepo.updateStatus).toHaveBeenCalledWith(
      'test-opportunity-id',
      'actionable'
    );
    // markReviewed was called but failed
    expect(opportunitiesRepo.markReviewed).toHaveBeenCalledWith('test-opportunity-id');
    // Error was logged but didn't fail the mutation
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
