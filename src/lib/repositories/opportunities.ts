/**
 * Opportunities Repository
 *
 * All database operations for AI-identified market opportunities.
 * Uses browser client for client-side operations by default.
 * For server-side operations (API routes), pass a server client via options.
 * RLS ensures only authenticated Maho/Kel users can access.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Database, Json } from '@/types/database';

/**
 * Options for repository operations
 * Pass a custom Supabase client for server-side operations
 */
export interface OpportunitiesRepoOptions {
  /** Custom Supabase client (use server client in API routes) */
  client?: SupabaseClient<Database>;
}

// Type aliases from generated types
type Opportunity = Database['public']['Tables']['opportunities']['Row'];
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];

// Enum types for type safety
export type OpportunityCategory =
  | 'market_gap'
  | 'product_opportunity'
  | 'competitive_weakness'
  | 'trend_alignment';

export type OpportunityStatus =
  | 'new'
  | 'reviewing'
  | 'actionable'
  | 'dismissed';

// Supporting evidence structure (for type safety when creating opportunities)
// NOTE: Uses singular entity_type names to align with entity_connections table
export interface SupportingEvidence {
  entity_type: 'company' | 'product' | 'consumer' | 'trend' | 'research';
  entity_id: string;
  relevance_score: number;
  excerpt: string;
}

// Input type for creating opportunities (omit auto-generated fields)
export interface OpportunityInput {
  title: string;
  description?: string;
  category: OpportunityCategory;
  confidence_score: number;
  supporting_evidence: SupportingEvidence[];
  generated_at?: Date;
}

/**
 * Opportunities repository - handles all opportunity CRUD operations
 */
export const opportunitiesRepo = {
  /**
   * Get all opportunities ordered by confidence score (highest first)
   *
   * @returns Array of all opportunities
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Opportunity[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('confidence_score', { ascending: false });

    if (error) throw mapPostgrestError(error);
    return data ?? [];
  },

  /**
   * Get single opportunity by ID
   *
   * @param id - Opportunity UUID
   * @returns Opportunity record
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Opportunity> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new RepositoryError('Opportunity not found', RepositoryErrorCode.NOT_FOUND);
    return data;
  },

  /**
   * Get opportunities by status
   *
   * @param status - Filter status
   * @returns Array of opportunities with matching status
   * @throws RepositoryError on database errors
   */
  getByStatus: async (status: OpportunityStatus): Promise<Opportunity[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', status)
      .order('confidence_score', { ascending: false });

    if (error) throw mapPostgrestError(error);
    return data ?? [];
  },

  /**
   * Get opportunities by category
   *
   * @param category - Filter category
   * @returns Array of opportunities with matching category
   * @throws RepositoryError on database errors
   */
  getByCategory: async (category: OpportunityCategory): Promise<Opportunity[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('category', category)
      .order('confidence_score', { ascending: false });

    if (error) throw mapPostgrestError(error);
    return data ?? [];
  },

  /**
   * Create new opportunity (used by AI generation job in Story 16-2)
   *
   * @param input - Opportunity data
   * @returns Created opportunity
   * @throws RepositoryError on database errors
   */
  create: async (input: OpportunityInput): Promise<Opportunity> => {
    const supabase = createClient();
    const insertData: OpportunityInsert = {
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      confidence_score: input.confidence_score,
      supporting_evidence: input.supporting_evidence as unknown as Json,
      generated_at: input.generated_at?.toISOString() ?? new Date().toISOString(),
      status: 'new',
    };

    const { data, error } = await supabase
      .from('opportunities')
      .insert(insertData)
      .select()
      .single();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new RepositoryError('Failed to create opportunity', RepositoryErrorCode.UNKNOWN);
    return data;
  },

  /**
   * Update opportunity status
   *
   * @param id - Opportunity UUID
   * @param status - New status
   * @returns Updated opportunity
   * @throws RepositoryError if not found
   */
  updateStatus: async (id: string, status: OpportunityStatus): Promise<Opportunity> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new RepositoryError('Opportunity not found', RepositoryErrorCode.NOT_FOUND);
    return data;
  },

  /**
   * Mark opportunity as reviewed (sets reviewed_at timestamp)
   *
   * @param id - Opportunity UUID
   * @returns Updated opportunity with reviewed_at set
   * @throws RepositoryError if not found
   */
  markReviewed: async (id: string): Promise<Opportunity> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opportunities')
      .update({ reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new RepositoryError('Opportunity not found', RepositoryErrorCode.NOT_FOUND);
    return data;
  },

  /**
   * Bulk create opportunities (for AI batch generation in Story 16-2)
   *
   * @param inputs - Array of opportunity data
   * @param options - Optional configuration including custom Supabase client
   * @returns Array of created opportunities
   * @throws RepositoryError on database errors
   */
  createBatch: async (
    inputs: OpportunityInput[],
    options?: OpportunitiesRepoOptions
  ): Promise<Opportunity[]> => {
    // Use provided client or fall back to browser client
    const supabase = options?.client ?? createClient();
    const insertData: OpportunityInsert[] = inputs.map(input => ({
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      confidence_score: input.confidence_score,
      supporting_evidence: input.supporting_evidence as unknown as Json,
      generated_at: input.generated_at?.toISOString() ?? new Date().toISOString(),
      status: 'new' as const,
    }));

    const { data, error } = await supabase
      .from('opportunities')
      .insert(insertData)
      .select();

    if (error) throw mapPostgrestError(error);
    return data ?? [];
  },

  /**
   * Delete all opportunities (for regeneration in Story 16-5)
   *
   * @param options - Optional configuration including custom Supabase client
   * @throws RepositoryError on database errors
   */
  deleteAll: async (options?: OpportunitiesRepoOptions): Promise<void> => {
    // Use provided client or fall back to browser client
    const supabase = options?.client ?? createClient();
    // Delete where id != impossible UUID to match all rows
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw mapPostgrestError(error);
  },
};

// Export the Opportunity type for use in components
export type { Opportunity };
