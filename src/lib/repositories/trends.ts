/**
 * Trends Repository
 *
 * All database operations for market trends from the knowledge base.
 * Uses browser client for client-side operations.
 * RLS ensures only authenticated users can access trend data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Database } from '@/types/database';

type Trend = Database['public']['Tables']['trends']['Row'];

/**
 * Trends repository - handles all market trend CRUD operations
 */
export const trendsRepo = {
  /**
   * Get all market trends
   * Returns trends ordered by name alphabetically
   *
   * @returns Array of all market trends
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Trend[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single trend by ID
   *
   * @param id - Trend UUID
   * @returns Market trend profile
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Trend> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Trend not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Export the Trend type for use in components
export type { Trend };
