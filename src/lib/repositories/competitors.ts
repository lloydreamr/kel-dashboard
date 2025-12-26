/**
 * Competitors Repository
 *
 * All database operations for competitor positioning data.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access competitor data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type {
  CompetitorDataPoint,
  CreateCompetitorInput,
  UpdateCompetitorInput,
} from '@/types';

/**
 * Competitors repository - handles all competitor data CRUD operations
 */
export const competitorsRepo = {
  /**
   * Get all competitor data points
   * Returns data points ordered by name
   *
   * @returns Array of all competitor data points
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<CompetitorDataPoint[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitor_data')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single competitor data point by ID
   *
   * @param id - Competitor data point ID
   * @returns Competitor data point
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<CompetitorDataPoint> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitor_data')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Competitor not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Create a new competitor data point
   *
   * @param input - Create competitor input
   * @returns Created competitor data point
   * @throws RepositoryError on database errors
   */
  create: async (input: CreateCompetitorInput): Promise<CompetitorDataPoint> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitor_data')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create competitor',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update an existing competitor data point
   *
   * @param id - Competitor data point ID
   * @param input - Update input
   * @returns Updated competitor data point
   * @throws RepositoryError on database errors
   */
  update: async (
    id: string,
    input: UpdateCompetitorInput
  ): Promise<CompetitorDataPoint> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitor_data')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Competitor not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Delete a competitor data point
   *
   * @param id - Competitor data point ID
   * @throws RepositoryError on database errors
   */
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('competitor_data')
      .delete()
      .eq('id', id);

    if (error) {
      throw mapPostgrestError(error);
    }
  },
};
