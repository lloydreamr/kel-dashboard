import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RepositoryErrorCode } from './base';
import { milestonesRepo, milestoneNotesRepo } from './milestones';

import type { Milestone, MilestoneNote } from '@/types/database';

// Mock data factories
function createMockMilestone(
  overrides?: Partial<Milestone>
): Milestone {
  return {
    id: 'milestone-123',
    category: 'market',
    status: 'not_started',
    completed_at: null,
    completed_by: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockMilestoneNote(
  overrides?: Partial<MilestoneNote>
): MilestoneNote {
  return {
    id: 'note-123',
    milestone_id: 'milestone-123',
    content: 'Test note',
    created_by: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const mockMilestone = createMockMilestone();
const mockMilestones = [
  mockMilestone,
  createMockMilestone({ id: 'milestone-456', category: 'product' }),
  createMockMilestone({ id: 'milestone-789', category: 'distribution' }),
];

const mockNote = createMockMilestoneNote();
const mockNotes = [
  mockNote,
  createMockMilestoneNote({ id: 'note-456', content: 'Second note' }),
];

// Mock Supabase client
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('milestonesRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup
    mockOrder.mockResolvedValue({ data: mockMilestones, error: null });
    mockEq.mockReturnValue({
      single: mockSingle,
      select: mockSelect,
      order: mockOrder,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
    });
    mockSingle.mockResolvedValue({ data: mockMilestone, error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  describe('getAll', () => {
    it('returns all milestones ordered by category', async () => {
      const milestones = await milestonesRepo.getAll();

      expect(milestones).toEqual(mockMilestones);
      expect(mockFrom).toHaveBeenCalledWith('milestones');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('category', { ascending: true });
    });

    it('throws RepositoryError on database error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Error' },
      });

      await expect(milestonesRepo.getAll()).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('returns milestone by ID', async () => {
      const milestone = await milestonesRepo.getById('milestone-123');

      expect(milestone).toEqual(mockMilestone);
      expect(mockFrom).toHaveBeenCalledWith('milestones');
      expect(mockEq).toHaveBeenCalledWith('id', 'milestone-123');
    });

    it('throws NOT_FOUND error when milestone not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        milestonesRepo.getById('nonexistent')
      ).rejects.toMatchObject({
        code: RepositoryErrorCode.NOT_FOUND,
        message: 'Milestone not found',
      });
    });
  });

  describe('getByCategory', () => {
    it('returns milestone by category', async () => {
      const milestone = await milestonesRepo.getByCategory('market');

      expect(milestone).toEqual(mockMilestone);
      expect(mockEq).toHaveBeenCalledWith('category', 'market');
    });

    it('throws NOT_FOUND error when category not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        milestonesRepo.getByCategory('product')
      ).rejects.toMatchObject({
        code: RepositoryErrorCode.NOT_FOUND,
      });
    });
  });

  describe('updateStatus', () => {
    it('updates milestone status', async () => {
      const milestone = await milestonesRepo.updateStatus(
        'milestone-123',
        'in_progress'
      );

      expect(milestone).toEqual(mockMilestone);
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_progress' });
      expect(mockEq).toHaveBeenCalledWith('id', 'milestone-123');
    });
  });

  describe('markComplete', () => {
    it('marks milestone as complete', async () => {
      const userId = 'user-123';
      const completedMilestone = createMockMilestone({
        status: 'complete',
        completed_by: userId,
      });

      mockSingle.mockResolvedValue({
        data: completedMilestone,
        error: null,
      });

      const milestone = await milestonesRepo.markComplete(
        'milestone-123',
        userId
      );

      expect(milestone.status).toBe('complete');
      expect(milestone.completed_by).toBe(userId);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('getProgress', () => {
    beforeEach(() => {
      // Mock count queries
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 50, error: null }),
        }),
      });
    });

    it('calculates progress correctly', async () => {
      // Setup: 30 approved out of 50 total
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 50, error: null }),
        }),
      });

      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 30, error: null }),
        }),
      });

      const progress = await milestonesRepo.getProgress('market');

      expect(progress).toEqual({
        total: 50,
        approved: 30,
        percentage: 60,
      });
    });

    it('handles zero division correctly', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      });

      const progress = await milestonesRepo.getProgress('product');

      expect(progress.percentage).toBe(0);
    });
  });
});

describe('milestoneNotesRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOrder.mockResolvedValue({ data: mockNotes, error: null });
    mockEq.mockReturnValue({
      single: mockSingle,
      select: mockSelect,
      order: mockOrder,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
    });
    mockSingle.mockResolvedValue({ data: mockNote, error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  describe('getNotesByMilestone', () => {
    it('returns notes for milestone', async () => {
      const notes = await milestoneNotesRepo.getNotesByMilestone(
        'milestone-123'
      );

      expect(notes).toEqual(mockNotes);
      expect(mockFrom).toHaveBeenCalledWith('milestone_notes');
      expect(mockEq).toHaveBeenCalledWith('milestone_id', 'milestone-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });
  });

  describe('createNote', () => {
    it('creates a new note', async () => {
      const input = {
        milestone_id: 'milestone-123',
        content: 'New note',
      };

      const note = await milestoneNotesRepo.createNote(input);

      expect(note).toEqual(mockNote);
      expect(mockInsert).toHaveBeenCalledWith(input);
    });
  });

  describe('updateNote', () => {
    it('updates existing note', async () => {
      const input = { content: 'Updated content' };

      const note = await milestoneNotesRepo.updateNote('note-123', input);

      expect(note).toEqual(mockNote);
      expect(mockUpdate).toHaveBeenCalledWith(input);
      expect(mockEq).toHaveBeenCalledWith('id', 'note-123');
    });
  });

  describe('deleteNote', () => {
    it('deletes note', async () => {
      mockEq.mockResolvedValue({ error: null });

      await milestoneNotesRepo.deleteNote('note-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'note-123');
    });

    it('throws error on database error', async () => {
      mockEq.mockResolvedValue({
        error: { code: 'PGRST116', message: 'Error' },
      });

      await expect(
        milestoneNotesRepo.deleteNote('note-123')
      ).rejects.toThrow();
    });
  });
});
