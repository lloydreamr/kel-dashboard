/**
 * Consumers Repository
 *
 * All database operations for consumer segment profiles from the knowledge base.
 * Uses browser client for client-side operations.
 * RLS ensures only authenticated users can access consumer data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Database } from '@/types/database';

type Consumer = Database['public']['Tables']['consumers']['Row'];

/**
 * Consumers repository - handles all consumer segment CRUD operations
 */
export const consumersRepo = {
  /**
   * Get all consumer segments
   * Returns consumers ordered by segment_name alphabetically
   *
   * @returns Array of all consumer segments
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Consumer[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('consumers')
      .select('*')
      .order('segment_name', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single consumer segment by ID
   *
   * @param id - Consumer UUID
   * @returns Consumer segment profile
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Consumer> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('consumers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Consumer segment not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Export the Consumer type for use in components
export type { Consumer };
