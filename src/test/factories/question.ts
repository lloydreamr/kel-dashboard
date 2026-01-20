/**
 * Question Test Factory
 *
 * Creates mock Question objects for testing.
 * Used by repository tests, hook tests, and component tests.
 */

import type { Question } from '@/types/database';
import type { QuestionWithEvidenceCount } from '@/types/question';

/**
 * Creates a mock Question with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage
 * const question = createMockQuestion();
 *
 * @example
 * // Ready for Kel to review
 * const readyQuestion = createMockQuestion({
 *   status: 'ready_for_kel',
 *   recommendation: 'Go with Option A',
 * });
 */
export function createMockQuestion(overrides?: Partial<Question>): Question {
  return {
    id: crypto.randomUUID(),
    title: 'Test Question',
    description: 'Test description for the question',
    category: 'product',
    recommendation: null,
    recommendation_rationale: null,
    status: 'draft',
    created_by: 'maho@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    viewed_by_kel_at: null,
    ...overrides,
  };
}

/**
 * Creates a mock Question ready for Kel's review.
 * Has recommendation and status set to ready_for_kel.
 */
export function createMockQuestionReadyForKel(
  overrides?: Partial<Question>
): Question {
  return createMockQuestion({
    status: 'ready_for_kel',
    recommendation: 'Proceed with the recommended approach',
    recommendation_rationale: 'Based on market research and cost analysis',
    ...overrides,
  });
}

/**
 * Creates a mock Question in a stale state for freshness testing.
 * Updated_at is set to 30 days ago by default.
 */
export function createMockStaleQuestion(overrides?: Partial<Question>): Question {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return createMockQuestion({
    updated_at: thirtyDaysAgo.toISOString(),
    ...overrides,
  });
}

/**
 * Creates a mock Question with evidence count.
 * Used for components that display evidence counts (QuestionCard, QuestionsList).
 *
 * @example
 * const question = createMockQuestionWithEvidenceCount({ evidence_count: 5 });
 */
export function createMockQuestionWithEvidenceCount(
  overrides?: Partial<QuestionWithEvidenceCount>
): QuestionWithEvidenceCount {
  const { evidence_count = 0, ...questionOverrides } = overrides ?? {};
  return {
    ...createMockQuestion(questionOverrides),
    evidence_count,
  };
}

/**
 * Creates a mock stale Question with evidence count.
 * Combines staleness (30 days old) with evidence count for freshness testing.
 */
export function createMockStaleQuestionWithEvidenceCount(
  overrides?: Partial<QuestionWithEvidenceCount>
): QuestionWithEvidenceCount {
  const { evidence_count = 0, ...questionOverrides } = overrides ?? {};
  return {
    ...createMockStaleQuestion(questionOverrides),
    evidence_count,
  };
}
