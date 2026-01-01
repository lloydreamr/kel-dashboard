/**
 * Evidence Test Factory
 *
 * Creates mock Evidence objects for testing.
 * Used by evidence repository tests, hook tests, and component tests.
 */

import type { Evidence } from '@/types/database';

/**
 * Creates a mock Evidence with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage
 * const evidence = createMockEvidence();
 *
 * @example
 * // Evidence linked to a specific question
 * const linkedEvidence = createMockEvidence({
 *   question_id: 'question-123',
 *   title: 'Market Research Report',
 *   url: 'https://example.com/report.pdf',
 * });
 */
export function createMockEvidence(overrides?: Partial<Evidence>): Evidence {
  return {
    id: crypto.randomUUID(),
    question_id: crypto.randomUUID(),
    title: 'Test Evidence',
    url: 'https://example.com/evidence',
    section_anchor: null,
    excerpt: null,
    created_by: 'maho@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock Evidence with full details.
 * Includes section anchor and excerpt.
 */
export function createMockEvidenceWithDetails(
  overrides?: Partial<Evidence>
): Evidence {
  return createMockEvidence({
    section_anchor: '#key-findings',
    excerpt:
      'The market analysis shows a 15% growth opportunity in the target segment.',
    ...overrides,
  });
}
