/**
 * Decisions Repository
 *
 * All database operations for Kel's decisions on strategic questions.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access decisions.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Decision, Json } from '@/types/database';
import type { CreateDecisionInput, UpdateDecisionInput } from '@/types/decision';

/**
 * Decisions repository - handles all decision CRUD operations
 */
export const decisionsRepo = {
  /**
   * Get all decisions
   *
   * @returns Array of decisions ordered by creation date (newest first)
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Decision[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get decision for a specific question
   *
   * @param questionId - Question ID to get decision for
   * @returns Decision or null if none exists
   * @throws RepositoryError on database errors
   */
  getByQuestionId: async (questionId: string): Promise<Decision | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      throw mapPostgrestError(error);
    }

    return data;
  },

  /**
   * Get a single decision by ID
   *
   * @param id - Decision ID
   * @returns Decision
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Decision> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Decision not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Create a new decision for a question
   *
   * @param input - Decision data to create
   * @returns Created decision
   * @throws RepositoryError on validation or database errors
   */
  create: async (input: CreateDecisionInput): Promise<Decision> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        question_id: input.question_id,
        decision_type: input.decision_type,
        constraints: (input.constraints as Json) ?? null,
        constraint_context: input.constraint_context ?? null,
        reasoning: input.reasoning ?? null,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create decision',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update a decision
   *
   * @param id - Decision ID to update
   * @param updates - Fields to update
   * @returns Updated decision
   * @throws RepositoryError if not found or access denied
   */
  update: async (id: string, updates: UpdateDecisionInput): Promise<Decision> => {
    const supabase = createClient();

    // Convert constraints to Json type if present
    const dbUpdates: Record<string, unknown> = { ...updates };
    if ('constraints' in updates) {
      dbUpdates.constraints = updates.constraints as Json;
    }

    const { data, error } = await supabase
      .from('decisions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Decision not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Delete a decision (used for undo functionality)
   *
   * @param id - Decision ID to delete
   * @throws RepositoryError if not found or access denied
   */
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('decisions').delete().eq('id', id);

    if (error) {
      throw mapPostgrestError(error);
    }
  },

  /**
   * Mark a decision's constraints as incorporated by Maho
   *
   * @param id - Decision ID
   * @returns Updated decision
   * @throws RepositoryError if not found or access denied
   */
  markIncorporated: async (id: string): Promise<Decision> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('decisions')
      .update({ incorporated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Decision not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Re-export types for consumers
export type { Decision, CreateDecisionInput, UpdateDecisionInput };
