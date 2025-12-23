import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RepositoryErrorCode, isRepositoryError } from './base';
import { questionsRepo } from './questions';

import type { Question } from '@/types/database';

// Mock data factory
function createMockQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'question-123',
    title: 'Test Question',
    description: 'Test description',
    category: 'product',
    recommendation: null,
    recommendation_rationale: null,
    status: 'draft',
    created_by: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    viewed_by_kel_at: null,
    ...overrides,
  };
}

const mockQuestion = createMockQuestion();
const mockQuestions = [
  mockQuestion,
  createMockQuestion({ id: 'question-456', title: 'Second Question' }),
];

// Mock Supabase client
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('questionsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup for array results
    mockOrder.mockResolvedValue({ data: mockQuestions, error: null });
    mockNeq.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({
      single: mockSingle,
      select: mockSelect,
      order: mockOrder,
      neq: mockNeq,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      neq: mockNeq,
      order: mockOrder,
    });
    mockSingle.mockResolvedValue({ data: mockQuestion, error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
  });

  describe('getAll', () => {
    it('returns all non-archived questions', async () => {
      const questions = await questionsRepo.getAll();

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockNeq).toHaveBeenCalledWith('status', 'archived');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(questions).toEqual(mockQuestions);
    });

    it('returns empty array when no questions exist', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const questions = await questionsRepo.getAll();
      expect(questions).toEqual([]);
    });

    it('throws RepositoryError on database error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'access denied' },
      });

      try {
        await questionsRepo.getAll();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.UNAUTHORIZED);
        }
      }
    });
  });

  describe('getById', () => {
    it('returns question when found', async () => {
      const question = await questionsRepo.getById('question-123');

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockEq).toHaveBeenCalledWith('id', 'question-123');
      expect(question).toEqual(mockQuestion);
    });

    it('throws NOT_FOUND when question does not exist', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await questionsRepo.getById('non-existent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
        }
      }
    });
  });

  describe('getByStatus', () => {
    it('returns questions with matching status', async () => {
      await questionsRepo.getByStatus('draft');

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockEq).toHaveBeenCalledWith('status', 'draft');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('returns empty array when no matching questions', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const questions = await questionsRepo.getByStatus('approved');
      expect(questions).toEqual([]);
    });
  });

  describe('getByCategory', () => {
    it('returns questions with matching category', async () => {
      await questionsRepo.getByCategory('product');

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockEq).toHaveBeenCalledWith('category', 'product');
      expect(mockNeq).toHaveBeenCalledWith('status', 'archived');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('returns empty array when no matching questions', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const questions = await questionsRepo.getByCategory('market');
      expect(questions).toEqual([]);
    });
  });

  describe('getArchived', () => {
    it('returns only archived questions', async () => {
      const archivedQuestions = [
        createMockQuestion({ id: 'arch-1', status: 'archived' }),
        createMockQuestion({ id: 'arch-2', status: 'archived' }),
      ];
      mockOrder.mockResolvedValue({ data: archivedQuestions, error: null });

      const questions = await questionsRepo.getArchived();

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockEq).toHaveBeenCalledWith('status', 'archived');
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(questions).toEqual(archivedQuestions);
    });

    it('returns empty array when no archived questions', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const questions = await questionsRepo.getArchived();
      expect(questions).toEqual([]);
    });

    it('throws RepositoryError on database error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'access denied' },
      });

      try {
        await questionsRepo.getArchived();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.UNAUTHORIZED);
        }
      }
    });
  });

  describe('create', () => {
    it('creates question with provided data', async () => {
      const input = {
        title: 'New Question',
        category: 'market' as const,
        created_by: 'user-123',
      };

      const question = await questionsRepo.create(input);

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Question',
          category: 'market',
          status: 'draft',
          created_by: 'user-123',
        })
      );
      expect(question).toEqual(mockQuestion);
    });

    it('creates question with optional fields', async () => {
      const input = {
        title: 'New Question',
        description: 'Detailed description',
        category: 'distribution' as const,
        recommendation: 'My recommendation',
        recommendation_rationale: 'Because...',
        status: 'ready_for_kel' as const,
        created_by: 'user-123',
      };

      await questionsRepo.create(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Question',
          description: 'Detailed description',
          recommendation: 'My recommendation',
          recommendation_rationale: 'Because...',
          status: 'ready_for_kel',
        })
      );
    });

    it('throws VALIDATION on invalid category', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '23514', message: 'check constraint violation' },
      });

      try {
        await questionsRepo.create({
          title: 'Test',
          // @ts-expect-error - testing invalid category
          category: 'invalid',
          created_by: 'user-123',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.VALIDATION);
        }
      }
    });
  });

  describe('update', () => {
    it('updates question with provided fields', async () => {
      const question = await questionsRepo.update('question-123', {
        title: 'Updated Title',
        status: 'ready_for_kel',
      });

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated Title',
        status: 'ready_for_kel',
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'question-123');
      expect(question).toEqual(mockQuestion);
    });

    it('throws NOT_FOUND when question does not exist', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await questionsRepo.update('non-existent', { title: 'New' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
        }
      }
    });
  });

  describe('markViewed', () => {
    it('sets viewed_by_kel_at timestamp', async () => {
      const question = await questionsRepo.markViewed('question-123');

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockUpdate).toHaveBeenCalledWith({
        viewed_by_kel_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'question-123');
      expect(question).toEqual(mockQuestion);
    });

    it('throws NOT_FOUND when question does not exist', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await questionsRepo.markViewed('non-existent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
        }
      }
    });
  });

  describe('archive', () => {
    it('sets status to archived', async () => {
      const question = await questionsRepo.archive('question-123');

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'archived' });
      expect(mockEq).toHaveBeenCalledWith('id', 'question-123');
      expect(question).toEqual(mockQuestion);
    });

    it('throws NOT_FOUND when question does not exist', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await questionsRepo.archive('non-existent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
        }
      }
    });
  });

  describe('restore', () => {
    it('sets status back to draft', async () => {
      const question = await questionsRepo.restore('question-123');

      expect(mockFrom).toHaveBeenCalledWith('questions');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'draft' });
      expect(mockEq).toHaveBeenCalledWith('id', 'question-123');
      expect(question).toEqual(mockQuestion);
    });

    it('throws NOT_FOUND when question does not exist', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await questionsRepo.restore('non-existent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(isRepositoryError(error)).toBe(true);
        if (isRepositoryError(error)) {
          expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
        }
      }
    });
  });
});
