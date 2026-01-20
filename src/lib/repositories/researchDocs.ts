/**
 * Research Docs Repository
 *
 * All database operations for research documents from the knowledge base.
 * Uses browser client for client-side operations.
 * RLS ensures only authenticated users can access research data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Database } from '@/types/database';

type ResearchDocRow = Database['public']['Tables']['research_docs']['Row'];

/**
 * Research docs repository - handles all research document CRUD operations
 */
export const researchDocsRepo = {
  /**
   * Get all research documents
   * Returns docs ordered by title alphabetically
   *
   * @returns Array of all research documents
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<ResearchDocRow[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('research_docs')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single research document by ID
   *
   * @param id - Research document UUID
   * @returns Research document
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<ResearchDocRow> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('research_docs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Research document not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Export the ResearchDoc type for use in components
export type ResearchDoc = ResearchDocRow;
