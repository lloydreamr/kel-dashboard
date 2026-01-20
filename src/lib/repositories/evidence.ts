/**
 * Evidence Repository
 *
 * All database operations for evidence links attached to questions.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access evidence.
 */

import { createClient } from '@/lib/supabase/client';
import { isValidEvidenceUrl } from '@/types/evidence';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Evidence } from '@/types/database';
import type {
  CreateEvidenceInput,
  CreatePhotoEvidenceInput,
  UpdateEvidenceInput,
} from '@/types/evidence';


/**
 * Evidence repository - handles all evidence CRUD operations
 */
export const evidenceRepo = {
  /**
   * Get all evidence for a specific question
   *
   * @param questionId - Question ID to get evidence for
   * @returns Array of evidence items ordered by creation date (oldest first)
   * @throws RepositoryError on database errors
   */
  getByQuestionId: async (questionId: string): Promise<Evidence[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single evidence item by ID
   *
   * @param id - Evidence ID
   * @returns Evidence item
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Evidence> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Evidence not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Create new evidence attached to a question
   *
   * @param input - Evidence data to create
   * @returns Created evidence
   * @throws RepositoryError on validation or database errors
   */
  create: async (input: CreateEvidenceInput): Promise<Evidence> => {
    // Validate required fields
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) {
      throw new RepositoryError(
        'Evidence title is required',
        RepositoryErrorCode.VALIDATION
      );
    }

    // Validate URL format and protocol
    if (!isValidEvidenceUrl(input.url)) {
      throw new RepositoryError(
        'Invalid URL. Only http:// and https:// URLs are allowed.',
        RepositoryErrorCode.VALIDATION
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('evidence')
      .insert({
        question_id: input.question_id,
        title: trimmedTitle,
        url: input.url,
        section_anchor: input.section_anchor ?? null,
        excerpt: input.excerpt ?? null,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create evidence',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Create new photo evidence from quick capture (Story 10-5)
   *
   * @param input - Photo evidence data to create
   * @returns Created evidence
   * @throws RepositoryError on validation or database errors
   */
  createPhotoEvidence: async (
    input: CreatePhotoEvidenceInput
  ): Promise<Evidence> => {
    // Validate required fields
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) {
      throw new RepositoryError(
        'Evidence title is required',
        RepositoryErrorCode.VALIDATION
      );
    }

    if (!input.image_url) {
      throw new RepositoryError(
        'Photo URL is required for photo evidence',
        RepositoryErrorCode.VALIDATION
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('evidence')
      .insert({
        question_id: input.question_id,
        title: trimmedTitle,
        url: null,
        image_url: input.image_url,
        source_type: 'photo',
        section_anchor: input.section_anchor ?? null,
        excerpt: input.excerpt ?? null,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create photo evidence',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update an evidence item
   *
   * @param id - Evidence ID to update
   * @param updates - Fields to update
   * @returns Updated evidence
   * @throws RepositoryError if not found or access denied
   */
  update: async (id: string, updates: UpdateEvidenceInput): Promise<Evidence> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('evidence')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Evidence not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Delete an evidence item
   *
   * @param id - Evidence ID to delete
   * @throws RepositoryError if not found or access denied
   */
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('evidence').delete().eq('id', id);

    if (error) {
      throw mapPostgrestError(error);
    }
  },

  /**
   * Count evidence items for a question
   *
   * @param questionId - Question ID to count evidence for
   * @returns Count of evidence items
   * @throws RepositoryError on database errors
   */
  countByQuestionId: async (questionId: string): Promise<number> => {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId);

    if (error) {
      throw mapPostgrestError(error);
    }

    return count ?? 0;
  },
};

// Re-export types for consumers
export type {
  Evidence,
  CreateEvidenceInput,
  CreatePhotoEvidenceInput,
  UpdateEvidenceInput,
};
