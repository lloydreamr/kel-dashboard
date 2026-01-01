/**
 * Decision Test Factory
 *
 * Creates mock Decision objects for testing.
 * Used by data integrity tests, hook tests, and component tests.
 */

import type { Decision } from '@/types/database';

/**
 * Creates a mock Decision with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage
 * const decision = createMockDecision();
 *
 * @example
 * // With constraints
 * const decisionWithConstraints = createMockDecision({
 *   decision_type: 'approved_with_constraint',
 *   constraints: [{ type: 'price', context: 'Under $5' }],
 *   constraint_context: 'Budget limitation',
 * });
 */
export function createMockDecision(overrides?: Partial<Decision>): Decision {
  return {
    id: crypto.randomUUID(),
    question_id: crypto.randomUUID(),
    decision_type: 'approved',
    constraints: null,
    constraint_context: null,
    reasoning: null,
    created_by: 'kel@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    incorporated_at: null,
    ...overrides,
  };
}

/**
 * Creates a mock Decision with constraints.
 * Convenience wrapper for the common "approved_with_constraint" case.
 */
export function createMockDecisionWithConstraints(
  overrides?: Partial<Decision>
): Decision {
  return createMockDecision({
    decision_type: 'approved_with_constraint',
    constraints: [{ type: 'price', context: 'Under $5 per unit' }],
    constraint_context: 'Budget limitation from initial planning',
    ...overrides,
  });
}
