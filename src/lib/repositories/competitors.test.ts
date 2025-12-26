import { describe, expect, it, vi, beforeEach } from 'vitest';

import { competitorsRepo } from './competitors';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }),
  }),
}));

describe('competitorsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
    });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({
      single: mockSingle,
      select: mockSelect,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getAll', () => {
    it('returns all competitor data points ordered by name', async () => {
      const mockCompetitors = [
        {
          id: 'c1',
          name: 'Competitor A',
          price_score: 5,
          quality_score: 7,
          category: null,
          notes: null,
          is_kel_position: false,
          created_by: 'user1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'c2',
          name: 'Competitor B',
          price_score: 8,
          quality_score: 6,
          category: null,
          notes: null,
          is_kel_position: false,
          created_by: 'user1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockCompetitors, error: null });

      const result = await competitorsRepo.getAll();

      expect(result).toEqual(mockCompetitors);
    });

    it('returns empty array when no data', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const result = await competitorsRepo.getAll();

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });

      const result = await competitorsRepo.getAll();

      expect(result).toEqual([]);
    });

    it('throws on database error', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      await expect(competitorsRepo.getAll()).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('returns competitor when found', async () => {
      const mockCompetitor = {
        id: 'c1',
        name: 'Test Competitor',
        price_score: 5,
        quality_score: 7,
        category: null,
        notes: null,
        is_kel_position: false,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockCompetitor, error: null });

      const result = await competitorsRepo.getById('c1');

      expect(result).toEqual(mockCompetitor);
    });

    it('throws NOT_FOUND when data is null', async () => {
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(competitorsRepo.getById('invalid')).rejects.toThrow(
        'Competitor not found'
      );
    });

    it('throws on database error', async () => {
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(competitorsRepo.getById('c1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates competitor with valid input', async () => {
      const input = {
        name: 'New Competitor',
        price_score: 6,
        quality_score: 8,
      };

      const mockCreated = {
        id: 'c3',
        ...input,
        category: null,
        notes: null,
        is_kel_position: false,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockInsert.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockCreated, error: null });

      const result = await competitorsRepo.create(input);

      expect(result).toEqual(mockCreated);
    });

    it('throws VALIDATION when score out of range', async () => {
      const input = {
        name: 'Invalid',
        price_score: 15, // Out of 1-10 range
        quality_score: 5,
      };

      mockInsert.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23514',
          message: 'Check constraint violation',
        },
      });

      await expect(competitorsRepo.create(input)).rejects.toThrow();
    });

    it('throws UNKNOWN when creation fails silently', async () => {
      const input = {
        name: 'Test',
        price_score: 5,
        quality_score: 5,
      };

      mockInsert.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(competitorsRepo.create(input)).rejects.toThrow(
        'Failed to create competitor'
      );
    });

    it('throws VALIDATION when price_score is below range (0)', async () => {
      const input = {
        name: 'Invalid Price Low',
        price_score: 0, // Below 1-10 range
        quality_score: 5,
      };

      mockInsert.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23514', message: 'Check constraint violation' },
      });

      await expect(competitorsRepo.create(input)).rejects.toThrow();
    });

    it('throws VALIDATION when quality_score is above range (11)', async () => {
      const input = {
        name: 'Invalid Quality High',
        price_score: 5,
        quality_score: 11, // Above 1-10 range
      };

      mockInsert.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23514', message: 'Check constraint violation' },
      });

      await expect(competitorsRepo.create(input)).rejects.toThrow();
    });

    it('accepts boundary value scores (1 and 10)', async () => {
      const input = {
        name: 'Boundary Test',
        price_score: 1, // Lower boundary
        quality_score: 10, // Upper boundary
      };

      const mockCreated = {
        id: 'c-boundary',
        ...input,
        category: null,
        notes: null,
        is_kel_position: false,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockInsert.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockCreated, error: null });

      const result = await competitorsRepo.create(input);

      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('updates competitor when found', async () => {
      const input = { name: 'Updated Name' };
      const mockUpdated = {
        id: 'c1',
        name: 'Updated Name',
        price_score: 5,
        quality_score: 7,
        category: null,
        notes: null,
        is_kel_position: false,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockUpdate.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await competitorsRepo.update('c1', input);

      expect(result).toEqual(mockUpdated);
    });

    it('throws NOT_FOUND when not found', async () => {
      const input = { name: 'Updated' };

      mockUpdate.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(competitorsRepo.update('invalid', input)).rejects.toThrow(
        'Competitor not found'
      );
    });

    it('throws on database error', async () => {
      const input = { price_score: 15 }; // Invalid

      mockUpdate.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23514', message: 'Check constraint' },
      });

      await expect(competitorsRepo.update('c1', input)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes competitor successfully', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await expect(competitorsRepo.delete('c1')).resolves.toBeUndefined();
    });

    it('throws on database error', async () => {
      mockEq.mockResolvedValueOnce({
        error: { code: '23503', message: 'Foreign key constraint' },
      });

      await expect(competitorsRepo.delete('c1')).rejects.toThrow();
    });
  });
});
