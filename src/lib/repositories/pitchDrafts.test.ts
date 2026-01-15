import { describe, expect, it, vi, beforeEach } from 'vitest';

import { pitchDraftsRepo } from './pitchDrafts';

// Mock Supabase client with proper chaining
const createMockQueryBuilder = () => {
  let mockData: unknown = null;
  let mockError: unknown = null;

  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data: mockData, error: mockError })),
    // Make builder itself a thenable for methods that don't chain
    then: (resolve: (val: { data: unknown; error: unknown }) => void) =>
      resolve({ data: mockData, error: mockError }),
    // Methods to set mock responses
    _setData: (data: unknown) => {
      mockData = data;
    },
    _setError: (error: unknown) => {
      mockError = error;
    },
  };

  return builder;
};

let mockBuilder: ReturnType<typeof createMockQueryBuilder>;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => mockBuilder,
  }),
}));

describe('pitchDraftsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuilder = createMockQueryBuilder();
  });

  describe('getAll', () => {
    it('returns all pitch drafts ordered by created_at desc', async () => {
      const mockDrafts = [
        { id: 'd1', title: 'Draft 1', status: 'draft' },
        { id: 'd2', title: 'Draft 2', status: 'ready' },
      ];
      mockBuilder._setData(mockDrafts);

      const result = await pitchDraftsRepo.getAll();

      expect(result).toEqual(mockDrafts);
      expect(mockBuilder.select).toHaveBeenCalledWith('*');
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('returns empty array when no drafts', async () => {
      mockBuilder._setData([]);

      const result = await pitchDraftsRepo.getAll();

      expect(result).toEqual([]);
    });

    it('throws on database error', async () => {
      mockBuilder._setError({ code: '42P01', message: 'Table not found' });

      await expect(pitchDraftsRepo.getAll()).rejects.toThrow();
    });
  });

  describe('getByStatus', () => {
    it('returns drafts filtered by status', async () => {
      const mockDrafts = [
        { id: 'd1', title: 'Draft 1', status: 'draft' },
      ];
      mockBuilder._setData(mockDrafts);

      const result = await pitchDraftsRepo.getByStatus('draft');

      expect(result).toEqual(mockDrafts);
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'draft');
    });

    it('returns empty array when no matching drafts', async () => {
      mockBuilder._setData([]);

      const result = await pitchDraftsRepo.getByStatus('exported');

      expect(result).toEqual([]);
    });
  });

  describe('getByTemplateType', () => {
    it('returns drafts filtered by template type', async () => {
      const mockDrafts = [
        { id: 'd1', title: 'Distributor Pitch', template_type: 'mid_size' },
      ];
      mockBuilder._setData(mockDrafts);

      const result = await pitchDraftsRepo.getByTemplateType('mid_size');

      expect(result).toEqual(mockDrafts);
      expect(mockBuilder.eq).toHaveBeenCalledWith('template_type', 'mid_size');
    });

    it('returns drafts with null template type when filtering for custom', async () => {
      const mockDrafts = [
        { id: 'd1', title: 'Custom Pitch', template_type: null },
      ];
      mockBuilder._setData(mockDrafts);

      const result = await pitchDraftsRepo.getByTemplateType(null);

      expect(result).toEqual(mockDrafts);
      expect(mockBuilder.is).toHaveBeenCalledWith('template_type', null);
    });
  });

  describe('getById', () => {
    it('returns pitch draft by ID', async () => {
      const mockDraft = {
        id: 'd1',
        title: 'Test Draft',
        status: 'draft',
      };
      mockBuilder._setData(mockDraft);

      const result = await pitchDraftsRepo.getById('d1');

      expect(result).toEqual(mockDraft);
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'd1');
      expect(mockBuilder.single).toHaveBeenCalled();
    });

    it('throws when not found', async () => {
      mockBuilder._setData(null);

      await expect(pitchDraftsRepo.getById('invalid')).rejects.toThrow(
        'Pitch draft not found'
      );
    });

    it('throws on database error', async () => {
      mockBuilder._setError({ code: '42501', message: 'Permission denied' });

      await expect(pitchDraftsRepo.getById('d1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates new pitch draft', async () => {
      const input = {
        title: 'New Pitch Draft',
        template_type: 'mid_size' as const,
      };
      const createdDraft = { id: 'd1', ...input, status: 'draft' };
      mockBuilder._setData(createdDraft);

      const result = await pitchDraftsRepo.create(input);

      expect(result).toEqual(createdDraft);
      expect(mockBuilder.insert).toHaveBeenCalled();
    });

    it('creates draft with default status', async () => {
      const input = { title: 'Simple Draft' };
      const createdDraft = { id: 'd1', title: 'Simple Draft', status: 'draft', template_type: null };
      mockBuilder._setData(createdDraft);

      const result = await pitchDraftsRepo.create(input);

      expect(result.status).toBe('draft');
    });

    it('throws on database error', async () => {
      mockBuilder._setError({ code: '23505', message: 'Unique violation' });

      await expect(
        pitchDraftsRepo.create({ title: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates pitch draft', async () => {
      const updatedDraft = {
        id: 'd1',
        title: 'Updated Title',
        status: 'ready',
      };
      mockBuilder._setData(updatedDraft);

      const result = await pitchDraftsRepo.update('d1', {
        title: 'Updated Title',
        status: 'ready',
      });

      expect(result).toEqual(updatedDraft);
      expect(mockBuilder.update).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'd1');
    });

    it('throws when not found', async () => {
      mockBuilder._setData(null);

      await expect(
        pitchDraftsRepo.update('invalid', { title: 'Test' })
      ).rejects.toThrow('Pitch draft not found');
    });
  });

  describe('updateStatus', () => {
    it('updates status to ready', async () => {
      const updatedDraft = {
        id: 'd1',
        status: 'ready',
      };
      mockBuilder._setData(updatedDraft);

      const result = await pitchDraftsRepo.updateStatus('d1', 'ready');

      expect(result.status).toBe('ready');
    });

    it('sets exported_at when marking as exported', async () => {
      const updatedDraft = {
        id: 'd1',
        status: 'exported',
        exported_at: '2025-01-01T00:00:00Z',
      };
      mockBuilder._setData(updatedDraft);

      const result = await pitchDraftsRepo.updateStatus('d1', 'exported');

      expect(result.exported_at).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('deletes pitch draft', async () => {
      mockBuilder._setData(null);
      mockBuilder._setError(null);

      await expect(pitchDraftsRepo.delete('d1')).resolves.not.toThrow();
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'd1');
    });

    it('throws on database error', async () => {
      mockBuilder._setError({ code: '42501', message: 'Permission denied' });

      await expect(pitchDraftsRepo.delete('d1')).rejects.toThrow();
    });
  });
});
