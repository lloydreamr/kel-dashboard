/**
 * Decision Domain Types
 *
 * Re-exports database types and defines domain-specific types
 * for working with Kel's decisions on strategic questions.
 */

// Re-export database types
export type { Decision, DecisionInsert, DecisionUpdate } from './database';

/**
 * Decision type enum values.
 * Kel's response to a question recommendation.
 */
export const DECISION_TYPES = {
  APPROVED: 'approved',
  APPROVED_WITH_CONSTRAINT: 'approved_with_constraint',
  EXPLORE_ALTERNATIVES: 'explore_alternatives',
} as const;

export type DecisionType = (typeof DECISION_TYPES)[keyof typeof DECISION_TYPES];

/**
 * Constraint type presets.
 * Quick selection categories per UX spec (4 chips).
 */
export const CONSTRAINT_PRESETS = {
  PRICE: 'price',
  VOLUME: 'volume',
  RISK: 'risk',
  TIMELINE: 'timeline',
} as const;

export type ConstraintPreset =
  (typeof CONSTRAINT_PRESETS)[keyof typeof CONSTRAINT_PRESETS];

/**
 * Single constraint in the constraints array.
 */
export interface Constraint {
  type: string; // Constraint type (preset or custom)
  context?: string; // Optional elaboration
}

/**
 * Input type for creating a new decision.
 * Excludes auto-generated fields (id, created_at, updated_at).
 */
export interface CreateDecisionInput {
  question_id: string;
  decision_type: DecisionType;
  constraints?: Constraint[] | null;
  constraint_context?: string | null;
  reasoning?: string | null;
  created_by: string;
}

/**
 * Input type for updating a decision.
 * All fields optional except what's being changed.
 */
export interface UpdateDecisionInput {
  decision_type?: DecisionType;
  constraints?: Constraint[] | null;
  constraint_context?: string | null;
  reasoning?: string | null;
  incorporated_at?: string | null;
}

/**
 * Submit decision input - unified for all decision types.
 * The mutation hook determines required fields based on decision_type.
 */
export interface SubmitDecisionInput {
  question_id: string;
  decision_type: DecisionType;
  constraints?: Constraint[];
  reasoning?: string;
}

/**
 * Validates constraints array structure.
 * Each constraint must have a non-empty type string.
 *
 * @param constraints - Array of constraints to validate
 * @returns true if valid, false otherwise
 */
export function isValidConstraintsArray(
  constraints: unknown
): constraints is Constraint[] {
  if (!Array.isArray(constraints)) return false;

  return constraints.every(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      'type' in c &&
      typeof c.type === 'string' &&
      c.type.trim().length > 0 &&
      (c.context === undefined || typeof c.context === 'string')
  );
}

/**
 * Gets human-readable label for decision type.
 *
 * @param type - Decision type
 * @returns Human-readable label
 */
export function getDecisionTypeLabel(type: DecisionType): string {
  const labels: Record<DecisionType, string> = {
    approved: 'Approved',
    approved_with_constraint: 'Approved with Constraints',
    explore_alternatives: 'Exploring Alternatives',
  };
  return labels[type] ?? type;
}

/**
 * Gets semantic color for decision type (for badges).
 *
 * @param type - Decision type
 * @returns Tailwind color class suffix (e.g., "success", "warning")
 */
export function getDecisionTypeColor(
  type: DecisionType
): 'success' | 'warning' | 'default' {
  const colors: Record<DecisionType, 'success' | 'warning' | 'default'> = {
    approved: 'success',
    approved_with_constraint: 'success',
    explore_alternatives: 'warning',
  };
  return colors[type] ?? 'default';
}
