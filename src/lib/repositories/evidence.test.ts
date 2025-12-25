import { describe, expect, it, vi, beforeEach } from 'vitest';

import { RepositoryErrorCode } from './base';
import { evidenceRepo } from './evidence';

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

describe('evidenceRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle, order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getByQuestionId', () => {
    it('returns evidence for a question', async () => {
      const mockEvidence = [
        { id: '1', title: 'Source 1', url: 'https://example.com' },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockEvidence, error: null });

      const result = await evidenceRepo.getByQuestionId('q1');

      expect(result).toEqual(mockEvidence);
    });

    it('returns empty array when no evidence', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const result = await evidenceRepo.getByQuestionId('q1');

      expect(result).toEqual([]);
    });

    it('throws on database error', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      await expect(evidenceRepo.getByQuestionId('q1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates new evidence', async () => {
      const newEvidence = {
        question_id: 'q1',
        title: 'Source',
        url: 'https://example.com',
        created_by: 'user1',
      };
      const createdEvidence = { id: 'e1', ...newEvidence };

      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: createdEvidence, error: null });

      const result = await evidenceRepo.create(newEvidence);

      expect(result).toEqual(createdEvidence);
    });

    it('throws on database error', async () => {
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23503', message: 'Foreign key violation' },
      });

      await expect(
        evidenceRepo.create({
          question_id: 'invalid',
          title: 'Test',
          url: 'https://example.com',
          created_by: 'user1',
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes evidence', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await expect(evidenceRepo.delete('e1')).resolves.not.toThrow();
    });

    it('throws on database error', async () => {
      mockEq.mockResolvedValueOnce({
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(evidenceRepo.delete('e1')).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('returns evidence by id', async () => {
      const mockEvidence = {
        id: 'e1',
        title: 'Source 1',
        url: 'https://example.com',
        question_id: 'q1',
        section_anchor: null,
        excerpt: null,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockEq.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockEvidence, error: null });

      const result = await evidenceRepo.getById('e1');

      expect(result).toEqual(mockEvidence);
    });

    it('throws on not found', async () => {
      mockEq.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(evidenceRepo.getById('nonexistent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates evidence', async () => {
      const updatedEvidence = {
        id: 'e1',
        title: 'Updated Title',
        url: 'https://example.com',
        question_id: 'q1',
        section_anchor: null,
        excerpt: null,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: updatedEvidence, error: null });

      const result = await evidenceRepo.update('e1', { title: 'Updated Title' });

      expect(result).toEqual(updatedEvidence);
    });

    it('throws on not found', async () => {
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(
        evidenceRepo.update('nonexistent', { title: 'New Title' })
      ).rejects.toThrow();
    });
  });

  describe('countByQuestionId', () => {
    it('returns count of evidence items', async () => {
      mockEq.mockResolvedValueOnce({ count: 5, error: null });

      const result = await evidenceRepo.countByQuestionId('q1');

      expect(result).toBe(5);
    });

    it('returns 0 when no evidence', async () => {
      mockEq.mockResolvedValueOnce({ count: 0, error: null });

      const result = await evidenceRepo.countByQuestionId('q1');

      expect(result).toBe(0);
    });

    it('throws on database error', async () => {
      mockEq.mockResolvedValueOnce({
        count: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      await expect(evidenceRepo.countByQuestionId('q1')).rejects.toThrow();
    });
  });

  describe('create validation', () => {
    it('throws on empty title', async () => {
      await expect(
        evidenceRepo.create({
          question_id: 'q1',
          title: '   ',
          url: 'https://example.com',
          created_by: 'user1',
        })
      ).rejects.toMatchObject({
        message: 'Evidence title is required',
        code: RepositoryErrorCode.VALIDATION,
      });
    });

    it('throws on invalid URL protocol', async () => {
      await expect(
        evidenceRepo.create({
          question_id: 'q1',
          title: 'Valid Title',
          url: 'javascript:alert(1)',
          created_by: 'user1',
        })
      ).rejects.toMatchObject({
        message: 'Invalid URL. Only http:// and https:// URLs are allowed.',
        code: RepositoryErrorCode.VALIDATION,
      });
    });

    it('throws on invalid URL format', async () => {
      await expect(
        evidenceRepo.create({
          question_id: 'q1',
          title: 'Valid Title',
          url: 'not-a-valid-url',
          created_by: 'user1',
        })
      ).rejects.toMatchObject({
        message: 'Invalid URL. Only http:// and https:// URLs are allowed.',
        code: RepositoryErrorCode.VALIDATION,
      });
    });
  });
});
