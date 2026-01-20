import { describe, expect, it, vi, beforeEach } from 'vitest';

import { pitchSectionsRepo, pitchSectionSourcesRepo } from './pitchSections';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
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

describe('pitchSectionsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
      order: mockOrder,
      eq: mockEq,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getByDraftId', () => {
    it('returns sections for a pitch draft', async () => {
      const mockSections = [
        { id: 's1', pitch_draft_id: 'd1', section_type: 'market_opportunity' },
        { id: 's2', pitch_draft_id: 'd1', section_type: 'competitive_positioning' },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockSections, error: null });

      const result = await pitchSectionsRepo.getByDraftId('d1');

      expect(result).toEqual(mockSections);
    });

    it('returns empty array when no sections', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const result = await pitchSectionsRepo.getByDraftId('d1');

      expect(result).toEqual([]);
    });

    it('throws on database error', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      await expect(pitchSectionsRepo.getByDraftId('d1')).rejects.toThrow();
    });
  });

  describe('getByDraftIdWithSources', () => {
    it('returns sections with sources', async () => {
      const mockSections = [
        {
          id: 's1',
          pitch_draft_id: 'd1',
          section_type: 'market_opportunity',
          content: 'Test content',
          ai_generated: true,
          user_edited: false,
          confidence_score: 0.85,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          pitch_section_sources: [
            { id: 'src1', source_type: 'company', source_id: 'c1', relevance_score: 0.9 },
          ],
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockSections, error: null });

      const result = await pitchSectionsRepo.getByDraftIdWithSources('d1');

      expect(result).toHaveLength(1);
      expect(result[0].sources).toHaveLength(1);
      expect(result[0].sources[0].source_type).toBe('company');
    });
  });

  describe('getById', () => {
    it('returns section by ID', async () => {
      const mockSection = {
        id: 's1',
        pitch_draft_id: 'd1',
        section_type: 'market_opportunity',
      };
      mockSingle.mockResolvedValueOnce({ data: mockSection, error: null });

      const result = await pitchSectionsRepo.getById('s1');

      expect(result).toEqual(mockSection);
    });

    it('throws when not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(pitchSectionsRepo.getById('invalid')).rejects.toThrow(
        'Pitch section not found'
      );
    });
  });

  describe('getByDraftAndType', () => {
    it('returns section for draft and type', async () => {
      const mockSection = {
        id: 's1',
        pitch_draft_id: 'd1',
        section_type: 'market_opportunity',
      };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockSection, error: null });

      const result = await pitchSectionsRepo.getByDraftAndType('d1', 'market_opportunity');

      expect(result).toEqual(mockSection);
    });

    it('returns null when no matching section', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await pitchSectionsRepo.getByDraftAndType('d1', 'trend_alignment');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates new pitch section', async () => {
      const input = {
        pitch_draft_id: 'd1',
        section_type: 'market_opportunity' as const,
        content: 'Generated content',
        confidence_score: 0.85,
      };
      const createdSection = { id: 's1', ...input, ai_generated: true, user_edited: false };

      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: createdSection, error: null });

      const result = await pitchSectionsRepo.create(input);

      expect(result).toEqual(createdSection);
    });

    it('sets ai_generated to true by default', async () => {
      const input = {
        pitch_draft_id: 'd1',
        section_type: 'market_opportunity' as const,
        content: 'Content',
      };
      const createdSection = { id: 's1', ...input, ai_generated: true, user_edited: false };

      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: createdSection, error: null });

      const result = await pitchSectionsRepo.create(input);

      expect(result.ai_generated).toBe(true);
    });
  });

  describe('update', () => {
    it('updates pitch section', async () => {
      const updatedSection = {
        id: 's1',
        content: 'Updated content',
        user_edited: true,
      };
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: updatedSection, error: null });

      const result = await pitchSectionsRepo.update('s1', {
        content: 'Updated content',
      });

      expect(result).toEqual(updatedSection);
    });

    it('marks as user_edited when content is updated', async () => {
      const updatedSection = {
        id: 's1',
        content: 'Edited content',
        user_edited: true,
      };
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: updatedSection, error: null });

      const result = await pitchSectionsRepo.update('s1', {
        content: 'Edited content',
      });

      expect(result.user_edited).toBe(true);
    });

    it('throws when not found', async () => {
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        pitchSectionsRepo.update('invalid', { content: 'Test' })
      ).rejects.toThrow('Pitch section not found');
    });
  });

  describe('delete', () => {
    it('deletes pitch section', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await expect(pitchSectionsRepo.delete('s1')).resolves.not.toThrow();
    });

    it('throws on database error', async () => {
      mockEq.mockResolvedValueOnce({
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(pitchSectionsRepo.delete('s1')).rejects.toThrow();
    });
  });

  describe('createBatch', () => {
    it('creates multiple sections at once', async () => {
      const sections = [
        { section_type: 'market_opportunity' as const, content: 'Market content' },
        { section_type: 'competitive_positioning' as const, content: 'Competitive content' },
        { section_type: 'trend_alignment' as const, content: 'Trend content' },
      ];
      const createdSections = sections.map((s, i) => ({
        id: `s${i}`,
        pitch_draft_id: 'd1',
        ...s,
        ai_generated: false,
        user_edited: false,
        confidence_score: null,
      }));

      mockSelect.mockResolvedValueOnce({ data: createdSections, error: null });

      const result = await pitchSectionsRepo.createBatch('d1', sections);

      expect(result).toEqual(createdSections);
      expect(result).toHaveLength(3);
    });

    it('returns empty array when no sections provided', async () => {
      const result = await pitchSectionsRepo.createBatch('d1', []);

      expect(result).toEqual([]);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('sets ai_generated to false by default for template sections', async () => {
      const sections = [
        { section_type: 'market_opportunity' as const, content: 'Content' },
      ];
      const createdSection = {
        id: 's1',
        pitch_draft_id: 'd1',
        section_type: 'market_opportunity',
        content: 'Content',
        ai_generated: false,
        user_edited: false,
        confidence_score: null,
      };

      mockSelect.mockResolvedValueOnce({ data: [createdSection], error: null });

      const result = await pitchSectionsRepo.createBatch('d1', sections);

      expect(result[0].ai_generated).toBe(false);
    });

    it('preserves provided ai_generated value', async () => {
      const sections = [
        { section_type: 'market_opportunity' as const, content: 'AI Content', ai_generated: true },
      ];
      const createdSection = {
        id: 's1',
        pitch_draft_id: 'd1',
        section_type: 'market_opportunity',
        content: 'AI Content',
        ai_generated: true,
        user_edited: false,
        confidence_score: null,
      };

      mockSelect.mockResolvedValueOnce({ data: [createdSection], error: null });

      const result = await pitchSectionsRepo.createBatch('d1', sections);

      expect(result[0].ai_generated).toBe(true);
    });

    it('throws on database error', async () => {
      const sections = [
        { section_type: 'market_opportunity' as const, content: 'Content' },
      ];

      mockSelect.mockResolvedValueOnce({
        data: null,
        error: { code: '23503', message: 'Foreign key violation' },
      });

      await expect(pitchSectionsRepo.createBatch('invalid', sections)).rejects.toThrow();
    });
  });
});

describe('pitchSectionSourcesRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getBySectionId', () => {
    it('returns sources for a section', async () => {
      const mockSources = [
        { id: 'src1', section_id: 's1', source_type: 'company', source_id: 'c1' },
        { id: 'src2', section_id: 's1', source_type: 'trend', source_id: 't1' },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockSources, error: null });

      const result = await pitchSectionSourcesRepo.getBySectionId('s1');

      expect(result).toEqual(mockSources);
    });

    it('returns empty array when no sources', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const result = await pitchSectionSourcesRepo.getBySectionId('s1');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates new source', async () => {
      const input = {
        section_id: 's1',
        source_type: 'company' as const,
        source_id: 'c1',
        relevance_score: 0.9,
      };
      const createdSource = { id: 'src1', ...input };

      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: createdSource, error: null });

      const result = await pitchSectionSourcesRepo.create(input);

      expect(result).toEqual(createdSource);
    });
  });

  describe('createMany', () => {
    it('creates multiple sources', async () => {
      const inputs = [
        { section_id: 's1', source_type: 'company' as const, source_id: 'c1' },
        { section_id: 's1', source_type: 'trend' as const, source_id: 't1' },
      ];
      const createdSources = inputs.map((input, i) => ({ id: `src${i}`, ...input }));

      mockSelect.mockResolvedValueOnce({ data: createdSources, error: null });

      const result = await pitchSectionSourcesRepo.createMany(inputs);

      expect(result).toEqual(createdSources);
    });

    it('returns empty array when no inputs', async () => {
      const result = await pitchSectionSourcesRepo.createMany([]);

      expect(result).toEqual([]);
    });
  });

  describe('deleteBySectionId', () => {
    it('deletes all sources for section', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await expect(pitchSectionSourcesRepo.deleteBySectionId('s1')).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes single source', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await expect(pitchSectionSourcesRepo.delete('src1')).resolves.not.toThrow();
    });
  });
});
