/**
 * Question Domain Types
 *
 * Re-exports database types and defines domain-specific types
 * for working with strategic questions.
 */

import type { Question } from './database';

// Re-export database types for convenience
export type {
  Question,
  QuestionInsert,
  QuestionUpdate,
} from './database';

/**
 * Question with evidence count for list display.
 * Includes the count of evidence items attached to the question.
 */
export interface QuestionWithEvidenceCount extends Question {
  evidence_count: number;
}

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

/**
 * Filter keys for status filtering UI.
 * Maps to one or more QuestionStatus values.
 */
export type StatusFilterKey = 'all' | 'draft' | 'sent' | 'decided';

/**
 * Configuration for a single status filter option.
 */
export interface StatusFilterConfig {
  /** Display text in UI (desktop) */
  label: string;
  /** Abbreviated label for mobile viewports */
  shortLabel: string;
  /** Array of QuestionStatus values to match, or null for "all" */
  statuses: QuestionStatus[] | null;
}

/**
 * Configuration for status filters.
 * - label: Display text in UI
 * - statuses: Array of QuestionStatus values to match, or null for "all"
 */
export const STATUS_FILTER_CONFIG: Record<StatusFilterKey, StatusFilterConfig> = {
  all: { label: 'All', shortLabel: 'All', statuses: null },
  draft: { label: 'Draft', shortLabel: 'Dft', statuses: ['draft'] },
  sent: { label: 'Sent to Kel', shortLabel: 'Sent', statuses: ['ready_for_kel'] },
  decided: { label: 'Decided', shortLabel: 'Dec', statuses: ['approved', 'exploring_alternatives'] },
};

/**
 * Array of filter keys in display order.
 */
export const STATUS_FILTER_KEYS: StatusFilterKey[] = ['all', 'draft', 'sent', 'decided'];

// ============================================================================
// Category Filter Types (Story 13.3)
// ============================================================================

/**
 * Filter keys for category filtering UI.
 * - 'all': Show all categories with grouped view
 * - 'market', 'product', 'distribution': Show only that category
 */
export type CategoryFilterKey = 'all' | 'market' | 'product' | 'distribution';

/**
 * Configuration for a single category filter option.
 */
export interface CategoryFilterConfig {
  /** Display text in UI (desktop) */
  label: string;
  /** Abbreviated label for mobile viewports */
  shortLabel: string;
}

/**
 * Configuration for category filters.
 * - label: Display text in UI
 * - shortLabel: Abbreviated label for mobile
 */
export const CATEGORY_FILTER_CONFIG: Record<CategoryFilterKey, CategoryFilterConfig> = {
  all: { label: 'All Categories', shortLabel: 'All' },
  market: { label: 'Market', shortLabel: 'Mkt' },
  product: { label: 'Product', shortLabel: 'Prod' },
  distribution: { label: 'Distribution', shortLabel: 'Dist' },
};

/**
 * Array of category filter keys in display order.
 */
export const CATEGORY_FILTER_KEYS: CategoryFilterKey[] = ['all', 'market', 'product', 'distribution'];

/**
 * Count of questions for each category filter option.
 * Used for displaying counts in category tabs.
 */
export type CategoryCounts = Record<CategoryFilterKey, number>;
