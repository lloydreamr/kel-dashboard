/**
 * Question Domain Types
 *
 * Re-exports database types and defines domain-specific types
 * for working with strategic questions.
 */

// Re-export database types for convenience
export type {
  Question,
  QuestionInsert,
  QuestionUpdate,
} from './database';

/**
 * Valid question status values.
 * - draft: Initial state, being prepared by Maho
 * - ready_for_kel: Ready for Kel to review/decide
 * - approved: Kel has approved the recommendation
 * - exploring_alternatives: Kel wants to explore other options
 * - archived: Question is no longer active
 */
export type QuestionStatus =
  | 'draft'
  | 'ready_for_kel'
  | 'approved'
  | 'exploring_alternatives'
  | 'archived';

/**
 * Valid question category values.
 * - market: Questions about market research, competitors, trends
 * - product: Questions about product development, features, specs
 * - distribution: Questions about distribution channels, partners
 */
export type QuestionCategory = 'market' | 'product' | 'distribution';

/**
 * Input type for creating a new question.
 * Excludes auto-generated fields (id, timestamps, viewed_by_kel_at).
 */
export interface CreateQuestionInput {
  title: string;
  description?: string | null;
  category: QuestionCategory;
  recommendation?: string | null;
  recommendation_rationale?: string | null;
  status?: QuestionStatus;
  created_by: string;
}

/**
 * Input type for updating a question.
 * All fields are optional.
 */
export interface UpdateQuestionInput {
  title?: string;
  description?: string | null;
  category?: QuestionCategory;
  recommendation?: string | null;
  recommendation_rationale?: string | null;
  status?: QuestionStatus;
  viewed_by_kel_at?: string | null;
}

/**
 * Array of all valid question statuses for validation.
 */
export const QUESTION_STATUSES: QuestionStatus[] = [
  'draft',
  'ready_for_kel',
  'approved',
  'exploring_alternatives',
  'archived',
];

/**
 * Array of all valid question categories for validation.
 */
export const QUESTION_CATEGORIES: QuestionCategory[] = [
  'market',
  'product',
  'distribution',
];

/**
 * Human-readable labels for question categories.
 */
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  market: 'Market',
  product: 'Product',
  distribution: 'Distribution',
};
