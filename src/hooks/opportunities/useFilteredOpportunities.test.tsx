import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';

import { useFilteredOpportunities } from './useFilteredOpportunities';

// Mock the opportunities repository
const mockGetAll = vi.fn();
vi.mock('@/lib/repositories/opportunities', () => ({
  opportunitiesRepo: {
    getAll: () => mockGetAll(),
  },
}));

// Mock opportunity data
const mockOpportunities = [
  {
    id: '1',
    title: 'Market Gap Opportunity',
    category: 'market_gap',
    status: 'new',
    confidence_score: 0.9,
    description: 'High confidence market gap',
  },
  {
    id: '2',
    title: 'Product Opportunity',
    category: 'product_opportunity',
    status: 'reviewing',
    confidence_score: 0.7,
    description: 'Medium confidence product opportunity',
  },
  {
    id: '3',
    title: 'Competitive Weakness',
    category: 'competitive_weakness',
    status: 'actionable',
    confidence_score: 0.3,
    description: 'Low confidence competitive insight',
  },
  {
    id: '4',
    title: 'Trend Alignment',
    category: 'trend_alignment',
    status: 'dismissed',
    confidence_score: 0.85,
    description: 'High confidence trend',
  },
  {
    id: '5',
    title: 'Another Market Gap',
    category: 'market_gap',
    status: 'new',
    confidence_score: 0.6,
    description: 'Medium confidence market gap',
  },
];

// Wrapper component with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useFilteredOpportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue(mockOpportunities);
  });

  describe('filtering', () => {
    it('returns all opportunities when filters are "all"', async () => {
      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(5);
    });

    it('filters by category', async () => {
      const { result } = renderHook(
        () => useFilteredOpportunities('market_gap', 'all'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(result.current.opportunities.every((o) => o.category === 'market_gap')).toBe(true);
    });

    it('filters by status', async () => {
      const { result } = renderHook(
        () => useFilteredOpportunities('all', 'new'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(result.current.opportunities.every((o) => o.status === 'new')).toBe(true);
    });

    it('filters by both category and status', async () => {
      const { result } = renderHook(
        () => useFilteredOpportunities('market_gap', 'new'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(
        result.current.opportunities.every(
          (o) => o.category === 'market_gap' && o.status === 'new'
        )
      ).toBe(true);
    });

    it('returns empty array when no matches', async () => {
      const { result } = renderHook(
        () => useFilteredOpportunities('trend_alignment', 'new'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(0);
    });
  });

  describe('counts calculation', () => {
    it('calculates correct category counts', async () => {
      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.counts.all).toBe(5);
      expect(result.current.counts.market_gap).toBe(2);
      expect(result.current.counts.product_opportunity).toBe(1);
      expect(result.current.counts.competitive_weakness).toBe(1);
      expect(result.current.counts.trend_alignment).toBe(1);
    });

    it('calculates correct status counts', async () => {
      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.counts.new).toBe(2);
      expect(result.current.counts.reviewing).toBe(1);
      expect(result.current.counts.actionable).toBe(1);
      expect(result.current.counts.dismissed).toBe(1);
    });

    it('returns zero counts when no data', async () => {
      mockGetAll.mockResolvedValue([]);

      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.counts.all).toBe(0);
      expect(result.current.counts.market_gap).toBe(0);
      expect(result.current.counts.new).toBe(0);
    });
  });

  describe('loading and error states', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('handles errors', async () => {
      const testError = new Error('Failed to fetch');
      mockGetAll.mockRejectedValue(testError);

      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('provides refetch function', async () => {
      const { result } = renderHook(() => useFilteredOpportunities('all', 'all'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
