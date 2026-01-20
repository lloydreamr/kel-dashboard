/**
 * Opportunity Domain Types
 *
 * UI-specific type aliases and helpers for opportunities.
 * Base types (Opportunity, OpportunityCategory, OpportunityStatus) come from repository.
 */

import type {
  OpportunityCategory,
  OpportunityStatus,
} from '@/lib/repositories/opportunities';

/** Category filter keys for opportunities browse page filtering */
export type OpportunityCategoryFilterKey = 'all' | OpportunityCategory;

/** Status filter keys for opportunities browse page filtering */
export type OpportunityStatusFilterKey = 'all' | OpportunityStatus;

/**
 * Get confidence level from score
 * @param score - Confidence score (0-1)
 * @returns 'high' (>0.8), 'medium' (0.5-0.8), or 'low' (<0.5)
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score > 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/** Display labels for category filters */
export const CATEGORY_LABELS: Record<OpportunityCategoryFilterKey, string> = {
  all: 'All',
  market_gap: 'Market Gap',
  product_opportunity: 'Product Opportunity',
  competitive_weakness: 'Competitive Weakness',
  trend_alignment: 'Trend Alignment',
} as const;

/** Category badge colors using Tailwind design tokens */
export const CATEGORY_COLORS: Record<OpportunityCategory, string> = {
  market_gap: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  product_opportunity: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  competitive_weakness: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  trend_alignment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
} as const;

/** Display labels for status filters */
export const STATUS_LABELS: Record<OpportunityStatusFilterKey, string> = {
  all: 'All',
  new: 'New',
  reviewing: 'Reviewing',
  actionable: 'Actionable',
  dismissed: 'Dismissed',
} as const;

/** Confidence level colors using Tailwind design tokens */
export const CONFIDENCE_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600',
} as const;
