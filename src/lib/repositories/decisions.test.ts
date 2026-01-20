import { describe, expect, it, vi, beforeEach } from 'vitest';

import { decisionsRepo } from './decisions';

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

describe('decisionsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getAll', () => {
    it('returns all decisions ordered by created_at desc', async () => {
      const mockDecisions = [
        { id: 'd1', question_id: 'q1', decision_type: 'approved' },
        { id: 'd2', question_id: 'q2', decision_type: 'explore_alternatives' },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockDecisions, error: null });

      const result = await decisionsRepo.getAll();

      expect(result).toEqual(mockDecisions);
    });

    it('returns empty array when no decisions', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const result = await decisionsRepo.getAll();

      expect(result).toEqual([]);
    });

    it('throws on database error', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      await expect(decisionsRepo.getAll()).rejects.toThrow();
    });
  });

  describe('getByQuestionId', () => {
    it('returns decision for question', async () => {
      const mockDecision = {
        id: 'd1',
        question_id: 'q1',
        decision_type: 'approved',
      };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockDecision, error: null });

      const result = await decisionsRepo.getByQuestionId('q1');

      expect(result).toEqual(mockDecision);
    });

    it('returns null when no decision exists', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await decisionsRepo.getByQuestionId('q1');

      expect(result).toBeNull();
    });

    it('throws on database error', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(decisionsRepo.getByQuestionId('q1')).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('returns decision by ID', async () => {
      const mockDecision = {
        id: 'd1',
        question_id: 'q1',
        decision_type: 'approved',
      };
      mockSingle.mockResolvedValueOnce({ data: mockDecision, error: null });

      const result = await decisionsRepo.getById('d1');

      expect(result).toEqual(mockDecision);
    });

    it('throws when not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(decisionsRepo.getById('invalid')).rejects.toThrow(
        'Decision not found'
      );
    });
  });

  describe('create', () => {
    it('creates new decision', async () => {
      const input = {
        question_id: 'q1',
        decision_type: 'approved' as const,
        created_by: 'user1',
      };
      const createdDecision = { id: 'd1', ...input };

      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: createdDecision, error: null });

      const result = await decisionsRepo.create(input);

      expect(result).toEqual(createdDecision);
    });

    it('creates decision with constraints', async () => {
      const input = {
        question_id: 'q1',
        decision_type: 'approved_with_constraint' as const,
        constraints: [{ type: 'budget', context: 'Under $50k' }],
        created_by: 'user1',
      };
      const createdDecision = { id: 'd1', ...input };

      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: createdDecision, error: null });

      const result = await decisionsRepo.create(input);

      expect(result).toEqual(createdDecision);
      expect(result.constraints).toEqual([
        { type: 'budget', context: 'Under $50k' },
      ]);
    });

    it('throws on duplicate question_id', async () => {
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'Unique violation' },
      });

      await expect(
        decisionsRepo.create({
          question_id: 'q1',
          decision_type: 'approved',
          created_by: 'user1',
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates decision', async () => {
      const updatedDecision = {
        id: 'd1',
        question_id: 'q1',
        decision_type: 'approved_with_constraint',
        constraints: [{ type: 'timeline' }],
      };
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: updatedDecision, error: null });

      const result = await decisionsRepo.update('d1', {
        decision_type: 'approved_with_constraint',
        constraints: [{ type: 'timeline' }],
      });

      expect(result).toEqual(updatedDecision);
    });

    it('throws when not found', async () => {
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        decisionsRepo.update('invalid', { decision_type: 'approved' })
      ).rejects.toThrow('Decision not found');
    });
  });

  describe('delete', () => {
    it('deletes decision', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      await expect(decisionsRepo.delete('d1')).resolves.not.toThrow();
    });

    it('throws on database error', async () => {
      mockEq.mockResolvedValueOnce({
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(decisionsRepo.delete('d1')).rejects.toThrow();
    });
  });

  describe('markIncorporated', () => {
    it('sets incorporated_at timestamp', async () => {
      const updatedDecision = {
        id: 'd1',
        question_id: 'q1',
        incorporated_at: '2025-12-24T00:00:00Z',
      };
      mockEq.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: updatedDecision, error: null });

      const result = await decisionsRepo.markIncorporated('d1');

      expect(result.incorporated_at).toBeTruthy();
    });
  });
});
