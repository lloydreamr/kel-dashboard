/**
 * Questions Repository
 *
 * All database operations for strategic questions.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access questions.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Question } from '@/types/database';
import type {
  QuestionStatus,
  QuestionCategory,
  CreateQuestionInput,
  UpdateQuestionInput,
} from '@/types/question';

/**
 * Questions repository - handles all question CRUD operations
 */
export const questionsRepo = {
  /**
   * Get all non-archived questions
   * Returns questions ordered by creation date (newest first)
   *
   * @returns Array of questions
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Question[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single question by ID
   *
   * @param id - Question ID
   * @returns Question
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Question> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Question not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Get questions filtered by status
   *
   * @param status - Question status to filter by
   * @returns Array of questions with the specified status
   * @throws RepositoryError on database errors
   */
  getByStatus: async (status: QuestionStatus): Promise<Question[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get questions filtered by category
   *
   * @param category - Question category to filter by
   * @returns Array of questions with the specified category
   * @throws RepositoryError on database errors
   */
  getByCategory: async (category: QuestionCategory): Promise<Question[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get all archived questions
   * Returns archived questions ordered by updated_at (most recently archived first)
   *
   * @returns Array of archived questions
   * @throws RepositoryError on database errors
   */
  getArchived: async (): Promise<Question[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Create a new question
   *
   * @param input - Question data to create
   * @returns Created question
   * @throws RepositoryError on validation or database errors
   */
  create: async (input: CreateQuestionInput): Promise<Question> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .insert({
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        recommendation: input.recommendation ?? null,
        recommendation_rationale: input.recommendation_rationale ?? null,
        status: input.status ?? 'draft',
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create question',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update a question
   *
   * @param id - Question ID to update
   * @param updates - Fields to update
   * @returns Updated question
   * @throws RepositoryError if not found or access denied
   */
  update: async (id: string, updates: UpdateQuestionInput): Promise<Question> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Question not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Mark a question as viewed by Kel
   * Sets the viewed_by_kel_at timestamp to now
   *
   * @param id - Question ID
   * @returns Updated question
   * @throws RepositoryError if not found or access denied
   */
  markViewed: async (id: string): Promise<Question> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .update({ viewed_by_kel_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Question not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Archive a question (soft delete)
   * Sets status to 'archived'
   *
   * @param id - Question ID to archive
   * @returns Archived question
   * @throws RepositoryError if not found or access denied
   */
  archive: async (id: string): Promise<Question> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Question not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Restore an archived question
   * Sets status back to 'draft'
   *
   * @param id - Question ID to restore
   * @returns Restored question
   * @throws RepositoryError if not found or access denied
   */
  restore: async (id: string): Promise<Question> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .update({ status: 'draft' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Question not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Re-export types for consumers
export type { Question, CreateQuestionInput, UpdateQuestionInput };
export type { QuestionStatus, QuestionCategory };
