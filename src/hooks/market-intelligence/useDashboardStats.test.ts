import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDashboardStats } from './useDashboardStats';

// Mock all the underlying hooks
vi.mock('@/hooks/companies', () => ({
  useCompanies: vi.fn(),
}));

vi.mock('@/hooks/products', () => ({
  useProducts: vi.fn(),
}));

vi.mock('@/hooks/research', () => ({
  useResearchDocs: vi.fn(),
}));

vi.mock('@/hooks/opportunities', () => ({
  useOpportunities: vi.fn(),
}));

vi.mock('@/hooks/questions', () => ({
  useQuestions: vi.fn(),
}));

// Import mocked functions for type-safe assertions
import { useCompanies } from '@/hooks/companies';
import { useOpportunities } from '@/hooks/opportunities';
import { useProducts } from '@/hooks/products';
import { useQuestions } from '@/hooks/questions';
import { useResearchDocs } from '@/hooks/research';

const mockUseCompanies = vi.mocked(useCompanies);
const mockUseProducts = vi.mocked(useProducts);
const mockUseResearchDocs = vi.mocked(useResearchDocs);
const mockUseOpportunities = vi.mocked(useOpportunities);
const mockUseQuestions = vi.mocked(useQuestions);

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for questions (can be overridden in individual tests)
    mockUseQuestions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useQuestions>);
  });

  describe('counts aggregation', () => {
    it('returns correct counts from all sources', () => {
      mockUseCompanies.mockReturnValue({
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [{ id: '1' }, { id: '2' }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [{ id: '1' }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.counts).toEqual({
        companies: 3,
        products: 2,
        research: 1,
        questions: 0,
      });
    });

    it('returns zero counts when data is empty', () => {
      mockUseCompanies.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.counts).toEqual({
        companies: 0,
        products: 0,
        research: 0,
        questions: 0,
      });
    });

    it('returns zero counts when data is undefined', () => {
      mockUseCompanies.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.counts).toEqual({
        companies: 0,
        products: 0,
        research: 0,
        questions: 0,
      });
    });
  });

  describe('loading states', () => {
    it('is loading when any source is loading', () => {
      mockUseCompanies.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.isLoading).toBe(true);
    });

    it('is not loading when all sources are loaded', () => {
      mockUseCompanies.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('returns first error encountered', () => {
      const companiesError = new Error('Companies failed');

      mockUseCompanies.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: companiesError,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.error).toBe(companiesError);
    });

    it('returns null error when no errors', () => {
      mockUseCompanies.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.error).toBeNull();
    });
  });

  describe('recent opportunities', () => {
    it('returns top 3 opportunities', () => {
      const opportunities = [
        { id: '1', confidence_score: 90 },
        { id: '2', confidence_score: 85 },
        { id: '3', confidence_score: 80 },
        { id: '4', confidence_score: 75 },
      ];

      mockUseCompanies.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: opportunities,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.recentOpportunities).toHaveLength(3);
      expect(result.current.recentOpportunities[0].id).toBe('1');
    });

    it('returns empty array when no opportunities', () => {
      mockUseCompanies.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.recentOpportunities).toEqual([]);
    });
  });

  describe('last updated calculation', () => {
    it('returns most recent date across all entities', () => {
      const oldDate = '2024-01-01T00:00:00Z';
      const midDate = '2024-06-15T00:00:00Z';
      const newDate = '2024-12-01T00:00:00Z';

      mockUseCompanies.mockReturnValue({
        data: [{ id: '1', updated_at: oldDate }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [{ id: '1', updated_at: newDate }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [{ id: '1', updated_at: midDate }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.lastUpdated).toEqual(new Date(newDate));
    });

    it('returns null when no entities have updated_at', () => {
      mockUseCompanies.mockReturnValue({
        data: [{ id: '1' }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.lastUpdated).toBeNull();
    });

    it('ignores null updated_at values', () => {
      const validDate = '2024-06-15T00:00:00Z';

      mockUseCompanies.mockReturnValue({
        data: [{ id: '1', updated_at: null }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useCompanies>);

      mockUseProducts.mockReturnValue({
        data: [{ id: '1', updated_at: validDate }],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProducts>);

      mockUseResearchDocs.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useResearchDocs>);

      mockUseOpportunities.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useOpportunities>);

      const { result } = renderHook(() => useDashboardStats());

      expect(result.current.lastUpdated).toEqual(new Date(validDate));
    });
  });
});
