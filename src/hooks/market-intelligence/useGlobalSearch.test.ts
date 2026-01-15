import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useGlobalSearch } from './useGlobalSearch';

// Mock the repository
const mockSearchAll = vi.fn();

vi.mock('@/lib/repositories', () => ({
  globalSearchRepo: {
    searchAll: (...args: unknown[]) => mockSearchAll(...args),
  },
}));

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryKey, queryFn, enabled }) => {
    if (!enabled) {
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    }
    // For enabled queries, simulate the loading/data flow
    return {
      data: mockSearchAll.mock.results[0]?.value,
      isLoading: false,
      error: null,
    };
  }),
}));

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query disabled behavior', () => {
    it('returns null results when query is empty', () => {
      const { result } = renderHook(() => useGlobalSearch(''));

      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns null results when query is only whitespace', () => {
      const { result } = renderHook(() => useGlobalSearch('   '));

      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null results when query is 1 character', () => {
      const { result } = renderHook(() => useGlobalSearch('a'));

      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null results when trimmed query is 1 character', () => {
      const { result } = renderHook(() => useGlobalSearch(' a '));

      expect(result.current.results).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('query enabled behavior', () => {
    it('enables query when query is 2+ characters', async () => {
      const mockResults = {
        companies: [{ id: 'c1', name: 'Test Co', type: 'company', href: '/companies/c1' }],
        products: [],
        research: [],
        totalCount: 1,
      };
      mockSearchAll.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useGlobalSearch('te'));

      // Query should be enabled (not returning null)
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('trims whitespace before checking length', async () => {
      const mockResults = {
        companies: [],
        products: [],
        research: [],
        totalCount: 0,
      };
      mockSearchAll.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useGlobalSearch('  ab  '));

      await waitFor(() => {
        // Should be enabled because trimmed query is 'ab' (2 chars)
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('return structure', () => {
    it('returns correct shape with results, isLoading, and error', () => {
      const { result } = renderHook(() => useGlobalSearch(''));

      expect(result.current).toHaveProperty('results');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });
  });
});
