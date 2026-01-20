/**
 * Research Doc Domain Types
 *
 * Type aliases and domain-specific interfaces for research documents.
 * Base ResearchDoc type comes from database.ts (auto-generated).
 */

import type { Database } from './database';

/** Research document from knowledge base */
export type ResearchDoc = Database['public']['Tables']['research_docs']['Row'];

/** Insert type for new research docs */
export type ResearchDocInsert = Database['public']['Tables']['research_docs']['Insert'];

/** Update type for research doc modifications */
export type ResearchDocUpdate = Database['public']['Tables']['research_docs']['Update'];

/** Category filter keys for research browse page filtering */
export type ResearchCategoryFilterKey =
  | 'all'
  | 'consumers'
  | 'trends'
  | 'distribution'
  | 'regulatory'
  | 'general';

/** Display labels for research category filters */
export const RESEARCH_CATEGORY_LABELS: Record<ResearchCategoryFilterKey, string> = {
  all: 'All',
  consumers: 'Consumers',
  trends: 'Trends',
  distribution: 'Distribution',
  regulatory: 'Regulatory',
  general: 'General',
} as const;
