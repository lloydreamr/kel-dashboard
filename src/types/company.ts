/**
 * Company Domain Types
 *
 * Type aliases and domain-specific interfaces for companies.
 * Base Company type comes from database.ts (auto-generated).
 */

import type { Database } from './database';

/** Company profile from knowledge base */
export type Company = Database['public']['Tables']['companies']['Row'];

/** Insert type for new companies */
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];

/** Update type for company modifications */
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

/** Category filter keys for browse page filtering */
export type CategoryFilterKey = 'all' | 'local_major' | 'multinational' | 'importer' | 'niche';

/** Display labels for category filters */
export const CATEGORY_LABELS: Record<CategoryFilterKey, string> = {
  all: 'All',
  local_major: 'Local Major',
  multinational: 'Multinational',
  importer: 'Importer',
  niche: 'Niche',
} as const;
