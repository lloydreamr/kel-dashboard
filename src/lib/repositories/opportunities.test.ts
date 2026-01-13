import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { opportunitiesRepo, type OpportunityInput } from './opportunities';
import { RepositoryErrorCode } from './base';

// Mock factory for Supabase responses
const createMockChain = (finalResult: { data: unknown; error: unknown }) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
  };
  // Make non-single calls resolve with result
  chain.select.mockImplementation(() => ({ ...chain, then: (fn: Function) => fn(finalResult) }));
  chain.order.mockResolvedValue(finalResult);
  return chain;
};

let mockFrom: Mock;

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => mockFrom(table),
  })),
}));

describe('opportunitiesRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // getAll tests
  // =========================================================================

  describe('getAll', () => {
    it('returns opportunities ordered by confidence_score desc', async () => {
      // Arrange - mock data matching Opportunity type
      const mockOpportunities = [
        {
          id: 'opp-1',
          title: 'Premium puffed snacks gap',
          description: 'URC weak in premium segment',
          category: 'market_gap',
          confidence_score: 0.92,
          supporting_evidence: [{ entity_type: 'company', entity_id: 'urc-id', relevance_score: 0.9, excerpt: 'URC market share declining' }],
          status: 'new',
          generated_at: '2026-01-14T00:00:00Z',
          reviewed_at: null,
          created_at: '2026-01-14T00:00:00Z',
          updated_at: '2026-01-14T00:00:00Z',
        },
        {
          id: 'opp-2',
          title: 'Cheese flavor trend',
          description: 'Growing demand for cheese',
          category: 'trend_alignment',
          confidence_score: 0.85,
          supporting_evidence: [],
          status: 'new',
          generated_at: '2026-01-14T00:00:00Z',
          reviewed_at: null,
          created_at: '2026-01-14T00:00:00Z',
          updated_at: '2026-01-14T00:00:00Z',
        },
      ];

      mockFrom = vi.fn(() => createMockChain({ data: mockOpportunities, error: null }));

      // Act
      const result = await opportunitiesRepo.getAll();

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('opportunities');
      expect(result).toHaveLength(2);
      expect(result[0].confidence_score).toBe(0.92); // Highest first
      expect(result[0].title).toBe('Premium puffed snacks gap');
    });

    it('returns empty array when no opportunities exist', async () => {
      mockFrom = vi.fn(() => createMockChain({ data: [], error: null }));

      const result = await opportunitiesRepo.getAll();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getById tests
  // =========================================================================

  describe('getById', () => {
    it('returns opportunity when found', async () => {
      const mockOpp = {
        id: 'opp-123',
        title: 'Test Opportunity',
        category: 'market_gap',
        confidence_score: 0.8,
        status: 'new',
      };
      mockFrom = vi.fn(() => createMockChain({ data: mockOpp, error: null }));

      const result = await opportunitiesRepo.getById('opp-123');

      expect(result.id).toBe('opp-123');
      expect(result.title).toBe('Test Opportunity');
    });

    it('throws NOT_FOUND when opportunity does not exist', async () => {
      mockFrom = vi.fn(() => createMockChain({ data: null, error: { code: 'PGRST116', message: 'Not found' } }));

      await expect(opportunitiesRepo.getById('nonexistent'))
        .rejects
        .toMatchObject({ code: RepositoryErrorCode.NOT_FOUND });
    });
  });

  // =========================================================================
  // getByStatus tests
  // =========================================================================

  describe('getByStatus', () => {
    it('filters opportunities by status', async () => {
      const mockNew = [{ id: 'opp-1', status: 'new', confidence_score: 0.9 }];
      mockFrom = vi.fn(() => createMockChain({ data: mockNew, error: null }));

      const result = await opportunitiesRepo.getByStatus('new');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('new');
    });
  });

  // =========================================================================
  // getByCategory tests
  // =========================================================================

  describe('getByCategory', () => {
    it('filters opportunities by category', async () => {
      const mockMarketGap = [{ id: 'opp-1', category: 'market_gap', confidence_score: 0.88 }];
      mockFrom = vi.fn(() => createMockChain({ data: mockMarketGap, error: null }));

      const result = await opportunitiesRepo.getByCategory('market_gap');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('market_gap');
    });

    it('returns empty array when no opportunities match category', async () => {
      mockFrom = vi.fn(() => createMockChain({ data: [], error: null }));

      const result = await opportunitiesRepo.getByCategory('competitive_weakness');

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // create tests
  // =========================================================================

  describe('create', () => {
    it('creates opportunity with all fields', async () => {
      const input: OpportunityInput = {
        title: 'Test Opportunity',
        description: 'Test description',
        category: 'market_gap',
        confidence_score: 0.85,
        supporting_evidence: [
          {
            entity_type: 'company',
            entity_id: 'test-uuid',
            relevance_score: 0.9,
            excerpt: 'Test excerpt',
          },
        ],
      };

      const mockCreated = { ...input, id: 'new-opp-id', status: 'new' };
      mockFrom = vi.fn(() => createMockChain({ data: mockCreated, error: null }));

      const result = await opportunitiesRepo.create(input);

      expect(result.id).toBe('new-opp-id');
      expect(result.status).toBe('new');
      expect(result.title).toBe('Test Opportunity');
    });

    it('throws VALIDATION error when title is empty', async () => {
      const input: OpportunityInput = {
        title: '', // Empty title violates check constraint
        category: 'market_gap',
        confidence_score: 0.5,
        supporting_evidence: [],
      };

      mockFrom = vi.fn(() =>
        createMockChain({
          data: null,
          error: { code: '23514', message: 'check constraint violation' },
        })
      );

      await expect(opportunitiesRepo.create(input)).rejects.toMatchObject({
        code: RepositoryErrorCode.VALIDATION,
      });
    });
  });

  // =========================================================================
  // updateStatus tests
  // =========================================================================

  describe('updateStatus', () => {
    it('updates status and returns updated opportunity', async () => {
      const mockUpdated = { id: 'opp-1', status: 'reviewing' };
      mockFrom = vi.fn(() => createMockChain({ data: mockUpdated, error: null }));

      const result = await opportunitiesRepo.updateStatus('opp-1', 'reviewing');

      expect(result.status).toBe('reviewing');
    });
  });

  // =========================================================================
  // markReviewed tests
  // =========================================================================

  describe('markReviewed', () => {
    it('sets reviewed_at timestamp', async () => {
      const mockReviewed = { id: 'opp-1', reviewed_at: '2026-01-14T12:00:00Z' };
      mockFrom = vi.fn(() => createMockChain({ data: mockReviewed, error: null }));

      const result = await opportunitiesRepo.markReviewed('opp-1');

      expect(result.reviewed_at).not.toBeNull();
    });
  });

  // =========================================================================
  // createBatch tests
  // =========================================================================

  describe('createBatch', () => {
    it('creates multiple opportunities in batch', async () => {
      const inputs: OpportunityInput[] = [
        {
          title: 'Opportunity 1',
          category: 'market_gap',
          confidence_score: 0.9,
          supporting_evidence: [],
        },
        {
          title: 'Opportunity 2',
          category: 'trend_alignment',
          confidence_score: 0.85,
          supporting_evidence: [],
        },
      ];

      const mockCreated = inputs.map((input, i) => ({ ...input, id: `opp-${i}`, status: 'new' }));
      mockFrom = vi.fn(() => createMockChain({ data: mockCreated, error: null }));

      const result = await opportunitiesRepo.createBatch(inputs);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Opportunity 1');
      expect(result[1].title).toBe('Opportunity 2');
    });
  });

  // =========================================================================
  // deleteAll tests
  // =========================================================================

  describe('deleteAll', () => {
    it('deletes all opportunities without error', async () => {
      mockFrom = vi.fn(() => createMockChain({ data: null, error: null }));

      await expect(opportunitiesRepo.deleteAll()).resolves.not.toThrow();
      expect(mockFrom).toHaveBeenCalledWith('opportunities');
    });
  });
});
