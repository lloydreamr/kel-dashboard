import { describe, expect, it, vi, beforeEach } from 'vitest';

import { globalSearchRepo } from './globalSearch';

// Mock chain functions
const mockIlike = vi.fn();
const mockLimit = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        ilike: mockIlike,
      }),
    }),
  }),
}));

describe('globalSearchRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockIlike.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  describe('searchAll', () => {
    it('returns grouped results from all three tables', async () => {
      const mockCompanies = [
        { id: 'c1', name: 'URC Corporation' },
        { id: 'c2', name: 'URC Foods' },
      ];
      const mockProducts = [{ id: 'p1', name: 'URC Chips' }];
      const mockResearch = [{ id: 'r1', title: 'URC Market Analysis' }];

      // Each table call returns different data
      mockOrder
        .mockResolvedValueOnce({ data: mockCompanies, error: null })
        .mockResolvedValueOnce({ data: mockProducts, error: null })
        .mockResolvedValueOnce({ data: mockResearch, error: null });

      const result = await globalSearchRepo.searchAll('urc');

      expect(result.companies).toHaveLength(2);
      expect(result.products).toHaveLength(1);
      expect(result.research).toHaveLength(1);
      expect(result.totalCount).toBe(4);
    });

    it('returns correct hrefs for navigation', async () => {
      const mockCompanies = [{ id: 'comp-123', name: 'Test Company' }];
      const mockProducts = [{ id: 'prod-456', name: 'Test Product' }];
      const mockResearch = [{ id: 'res-789', title: 'Test Research' }];

      mockOrder
        .mockResolvedValueOnce({ data: mockCompanies, error: null })
        .mockResolvedValueOnce({ data: mockProducts, error: null })
        .mockResolvedValueOnce({ data: mockResearch, error: null });

      const result = await globalSearchRepo.searchAll('test');

      expect(result.companies[0].href).toBe(
        '/market-intelligence/companies/comp-123'
      );
      expect(result.products[0].href).toBe(
        '/market-intelligence/products/prod-456'
      );
      expect(result.research[0].href).toBe(
        '/market-intelligence/research/res-789'
      );
    });

    it('returns empty results when no matches', async () => {
      mockOrder
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const result = await globalSearchRepo.searchAll('nonexistent');

      expect(result.companies).toHaveLength(0);
      expect(result.products).toHaveLength(0);
      expect(result.research).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('handles null data from database gracefully', async () => {
      mockOrder
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const result = await globalSearchRepo.searchAll('test');

      expect(result.companies).toHaveLength(0);
      expect(result.products).toHaveLength(0);
      expect(result.research).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('throws error when companies query fails', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      await expect(globalSearchRepo.searchAll('test')).rejects.toThrow();
    });

    it('throws error when products query fails', async () => {
      mockOrder
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { code: '42P01', message: 'Table not found' },
        });

      await expect(globalSearchRepo.searchAll('test')).rejects.toThrow();
    });

    it('throws error when research_docs query fails', async () => {
      mockOrder
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { code: '42P01', message: 'Table not found' },
        });

      await expect(globalSearchRepo.searchAll('test')).rejects.toThrow();
    });

    it('returns correct types for each entity', async () => {
      const mockCompanies = [{ id: 'c1', name: 'Company A' }];
      const mockProducts = [{ id: 'p1', name: 'Product B' }];
      const mockResearch = [{ id: 'r1', title: 'Research C' }];

      mockOrder
        .mockResolvedValueOnce({ data: mockCompanies, error: null })
        .mockResolvedValueOnce({ data: mockProducts, error: null })
        .mockResolvedValueOnce({ data: mockResearch, error: null });

      const result = await globalSearchRepo.searchAll('test');

      expect(result.companies[0].type).toBe('company');
      expect(result.products[0].type).toBe('product');
      expect(result.research[0].type).toBe('research');
    });

    it('maps research title to name field', async () => {
      const mockResearch = [{ id: 'r1', title: 'Market Analysis Report' }];

      mockOrder
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: mockResearch, error: null });

      const result = await globalSearchRepo.searchAll('market');

      expect(result.research[0].name).toBe('Market Analysis Report');
    });
  });
});
