/**
 * Companies Repository
 *
 * All database operations for company profiles from the knowledge base.
 * Uses browser client for client-side operations.
 * RLS ensures only authenticated users can access company data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Database } from '@/types/database';

type Company = Database['public']['Tables']['companies']['Row'];

/**
 * Companies repository - handles all company data CRUD operations
 */
export const companiesRepo = {
  /**
   * Get all company profiles
   * Returns companies ordered by name alphabetically
   *
   * @returns Array of all company profiles
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Company[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single company by ID
   *
   * @param id - Company UUID
   * @returns Company profile
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Company> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Company not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Export the Company type for use in components
export type { Company };
