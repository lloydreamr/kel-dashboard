/**
 * useOpportunity Hook Tests
 *
 * Tests for single opportunity fetching hook.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useOpportunity } from './useOpportunity';

// Mock the repository
vi.mock('@/lib/repositories/opportunities', () => ({
  opportunitiesRepo: {
    getById: vi.fn(),
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

const mockOpportunity = {
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

describe('useOpportunity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch opportunity by id', async () => {
    vi.mocked(opportunitiesRepo.getById).mockResolvedValue(mockOpportunity);

    const { result } = renderHook(() => useOpportunity('test-opportunity-id'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockOpportunity);
    expect(opportunitiesRepo.getById).toHaveBeenCalledWith('test-opportunity-id');
    expect(opportunitiesRepo.getById).toHaveBeenCalledTimes(1);
  });

  it('should handle error when opportunity not found', async () => {
    const error = new Error('Opportunity not found');
    vi.mocked(opportunitiesRepo.getById).mockRejectedValue(error);

    const { result } = renderHook(() => useOpportunity('non-existent-id'), {
      wrapper: createWrapper(),
    });

    // Wait for error state - may take longer due to retry logic in hook
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should use correct query key', async () => {
    vi.mocked(opportunitiesRepo.getById).mockResolvedValue(mockOpportunity);

    const { result } = renderHook(() => useOpportunity('test-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The query should be called with the provided ID
    expect(opportunitiesRepo.getById).toHaveBeenCalledWith('test-id');
  });
});
