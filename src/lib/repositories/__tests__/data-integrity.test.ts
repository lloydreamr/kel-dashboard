/**
 * Data Integrity Verification Tests
 *
 * Verifies that all data fields are correctly persisted and retrieved.
 * These tests ensure NFR12 compliance: zero data loss for decisions.
 *
 * @see Story 7.5: Data Preservation & Backup Verification
 * @see NFR12: Zero data loss for decisions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createMockDecision,
  createMockDecisionWithConstraints,
  createMockQuestion,
  createMockEvidence,
} from '@/test/factories';

import type { Decision, Question, Evidence } from '@/types/database';

// Mock Supabase client
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('Data Integrity Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValue({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
      order: mockOrder,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      eq: mockEq,
      order: mockOrder,
    });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
  });

  describe('Decision Data Integrity (NFR12)', () => {
    it('preserves all decision fields after creation', async () => {
      // Arrange
      const inputDecision = createMockDecisionWithConstraints({
        question_id: 'question-123',
        constraints: [
          { type: 'price', context: 'Under $5' },
          { type: 'quantity', context: 'Minimum 100 units' },
        ],
        constraint_context: 'Budget and volume limitations',
        reasoning: 'Market analysis indicates price sensitivity',
        created_by: 'kel@example.com',
      });

      // Simulate successful insert returning all fields
      mockSingle.mockResolvedValue({ data: inputDecision, error: null });

      // Import after mocking
      const { decisionsRepo } = await import('../decisions');

      // Act
      const decision = await decisionsRepo.create({
        question_id: inputDecision.question_id,
        decision_type: inputDecision.decision_type,
        constraints: inputDecision.constraints,
        constraint_context: inputDecision.constraint_context,
        reasoning: inputDecision.reasoning,
        created_by: inputDecision.created_by,
      });

      // Assert - verify all fields are preserved
      expect(decision.id).toBe(inputDecision.id);
      expect(decision.question_id).toBe('question-123');
      expect(decision.decision_type).toBe('approved_with_constraint');
      expect(decision.constraints).toEqual([
        { type: 'price', context: 'Under $5' },
        { type: 'quantity', context: 'Minimum 100 units' },
      ]);
      expect(decision.constraint_context).toBe('Budget and volume limitations');
      expect(decision.reasoning).toBe('Market analysis indicates price sensitivity');
      expect(decision.created_by).toBe('kel@example.com');
      expect(decision.incorporated_at).toBeNull();
    });

    it('preserves constraints array structure correctly', async () => {
      // Arrange - complex constraints with nested data
      const complexConstraints = [
        { type: 'price', context: 'Max $5', priority: 1 },
        { type: 'quality', context: 'Premium only', notes: 'Based on market research' },
        { type: 'timing', context: 'Q2 2026', deadline: '2026-06-30' },
      ];

      const decision = createMockDecision({
        decision_type: 'approved_with_constraint',
        constraints: complexConstraints,
      });

      mockMaybeSingle.mockResolvedValue({ data: decision, error: null });

      const { decisionsRepo } = await import('../decisions');

      // Act
      const retrieved = await decisionsRepo.getByQuestionId(decision.question_id);

      // Assert - verify array structure is preserved exactly
      expect(retrieved).not.toBeNull();
      expect(retrieved!.constraints).toEqual(complexConstraints);
      expect(Array.isArray(retrieved!.constraints)).toBe(true);
      expect((retrieved!.constraints as Array<unknown>).length).toBe(3);
    });

    it('update preserves unchanged fields', async () => {
      // Arrange
      const originalDecision = createMockDecisionWithConstraints({
        id: 'decision-123',
        reasoning: 'Original reasoning',
      });

      const updatedDecision = {
        ...originalDecision,
        constraint_context: 'Updated context',
        // reasoning should remain unchanged
      };

      mockSingle.mockResolvedValue({ data: updatedDecision, error: null });

      const { decisionsRepo } = await import('../decisions');

      // Act - only update constraint_context
      const result = await decisionsRepo.update('decision-123', {
        constraint_context: 'Updated context',
      });

      // Assert - verify update only changed specified field
      expect(mockUpdate).toHaveBeenCalledWith({
        constraint_context: 'Updated context',
      });
      expect(result.reasoning).toBe('Original reasoning');
      expect(result.constraints).toEqual(originalDecision.constraints);
    });

    it('getByQuestionId returns null for missing decision (not error)', async () => {
      // This verifies the "one decision per question" model
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const { decisionsRepo } = await import('../decisions');

      // Act
      const result = await decisionsRepo.getByQuestionId('non-existent-question');

      // Assert - should return null, not throw
      expect(result).toBeNull();
    });
  });

  describe('Question Data Integrity', () => {
    it('preserves all question fields after creation', async () => {
      // Arrange
      const inputQuestion = createMockQuestion({
        title: 'Strategic pricing question',
        description: 'How should we price for the Philippine market?',
        category: 'product',
        recommendation: 'Start at $4.50',
        recommendation_rationale: 'Competitive analysis shows this is optimal',
      });

      mockSingle.mockResolvedValue({ data: inputQuestion, error: null });

      const { questionsRepo } = await import('../questions');

      // Act
      const question = await questionsRepo.create({
        title: inputQuestion.title,
        description: inputQuestion.description,
        category: inputQuestion.category,
        recommendation: inputQuestion.recommendation,
        recommendation_rationale: inputQuestion.recommendation_rationale,
        created_by: inputQuestion.created_by,
      });

      // Assert - verify all fields are preserved
      expect(question.title).toBe('Strategic pricing question');
      expect(question.description).toBe('How should we price for the Philippine market?');
      expect(question.category).toBe('product');
      expect(question.recommendation).toBe('Start at $4.50');
      expect(question.recommendation_rationale).toBe(
        'Competitive analysis shows this is optimal'
      );
    });

    it('update preserves unmodified fields', async () => {
      // Arrange
      const originalQuestion = createMockQuestion({
        id: 'question-123',
        title: 'Original title',
        description: 'Original description',
        recommendation: 'Original recommendation',
      });

      const updatedQuestion = {
        ...originalQuestion,
        title: 'Updated title',
        // description and recommendation should remain unchanged
      };

      mockSingle.mockResolvedValue({ data: updatedQuestion, error: null });

      const { questionsRepo } = await import('../questions');

      // Act
      const result = await questionsRepo.update('question-123', {
        title: 'Updated title',
      });

      // Assert - verify only title was requested to be updated
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated title',
      });
      // The result should have preserved fields (as returned by mock)
      expect(result.description).toBe('Original description');
      expect(result.recommendation).toBe('Original recommendation');
    });
  });

  describe('Evidence Data Integrity', () => {
    it('preserves evidence links when question is updated', async () => {
      // Arrange
      const question = createMockQuestion({ id: 'question-123' });
      const evidence1 = createMockEvidence({
        id: 'evidence-1',
        question_id: 'question-123',
        title: 'Market Research',
      });
      const evidence2 = createMockEvidence({
        id: 'evidence-2',
        question_id: 'question-123',
        title: 'Competitor Analysis',
      });

      // Mock question update returning the question
      mockSingle.mockResolvedValue({
        data: { ...question, title: 'Updated title' },
        error: null,
      });

      // Mock evidence query returning linked evidence
      mockOrder.mockResolvedValue({
        data: [evidence1, evidence2],
        error: null,
      });

      const { questionsRepo } = await import('../questions');
      const { evidenceRepo } = await import('../evidence');

      // Act - Update question
      await questionsRepo.update('question-123', { title: 'Updated title' });

      // Then verify evidence is still linked
      const linkedEvidence = await evidenceRepo.getByQuestionId('question-123');

      // Assert - evidence links should be preserved
      expect(linkedEvidence).toHaveLength(2);
      expect(linkedEvidence[0].id).toBe('evidence-1');
      expect(linkedEvidence[1].id).toBe('evidence-2');
    });

    it('preserves all evidence fields after creation', async () => {
      // Arrange
      const inputEvidence = createMockEvidence({
        question_id: 'question-123',
        title: 'WOFEX 2026 Exhibitor Guide',
        url: 'https://wofex.com/exhibitor-guide',
        section_anchor: '#food-products',
        excerpt: 'Key insights about food product exhibitors',
      });

      mockSingle.mockResolvedValue({ data: inputEvidence, error: null });

      const { evidenceRepo } = await import('../evidence');

      // Act
      const evidence = await evidenceRepo.create({
        question_id: inputEvidence.question_id,
        title: inputEvidence.title,
        url: inputEvidence.url,
        section_anchor: inputEvidence.section_anchor,
        excerpt: inputEvidence.excerpt,
        created_by: inputEvidence.created_by,
      });

      // Assert - verify all fields are preserved
      expect(evidence.question_id).toBe('question-123');
      expect(evidence.title).toBe('WOFEX 2026 Exhibitor Guide');
      expect(evidence.url).toBe('https://wofex.com/exhibitor-guide');
      expect(evidence.section_anchor).toBe('#food-products');
      expect(evidence.excerpt).toBe('Key insights about food product exhibitors');
    });
  });

  describe('Null Value Preservation', () => {
    it('preserves null values correctly for optional decision fields', async () => {
      // Arrange
      const decisionWithNulls = createMockDecision({
        constraints: null,
        constraint_context: null,
        reasoning: null,
        incorporated_at: null,
      });

      mockMaybeSingle.mockResolvedValue({ data: decisionWithNulls, error: null });

      const { decisionsRepo } = await import('../decisions');

      // Act
      const retrieved = await decisionsRepo.getByQuestionId(
        decisionWithNulls.question_id
      );

      // Assert - null values should be explicitly null, not undefined
      expect(retrieved).not.toBeNull();
      expect(retrieved!.constraints).toBeNull();
      expect(retrieved!.constraint_context).toBeNull();
      expect(retrieved!.reasoning).toBeNull();
      expect(retrieved!.incorporated_at).toBeNull();
    });

    it('preserves null values correctly for optional question fields', async () => {
      // Arrange
      const questionWithNulls = createMockQuestion({
        description: null,
        recommendation: null,
        recommendation_rationale: null,
        viewed_by_kel_at: null,
      });

      mockSingle.mockResolvedValue({ data: questionWithNulls, error: null });

      const { questionsRepo } = await import('../questions');

      // Act
      const retrieved = await questionsRepo.getById(questionWithNulls.id);

      // Assert - null values should be explicitly null
      expect(retrieved.description).toBeNull();
      expect(retrieved.recommendation).toBeNull();
      expect(retrieved.recommendation_rationale).toBeNull();
      expect(retrieved.viewed_by_kel_at).toBeNull();
    });
  });
});
