/**
 * Pitch Drafts Repository
 *
 * All database operations for pitch drafts.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access pitch drafts.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { PitchDraft } from '@/types/database';
import type {
  PitchDraftStatus,
  PitchTemplateType,
  CreatePitchDraftInput,
  UpdatePitchDraftInput,
  PitchDraftWithSections,
  PitchSectionType,
  PitchSourceType,
} from '@/types/pitch';

/**
 * Pitch drafts repository - handles all pitch draft CRUD operations
 */
export const pitchDraftsRepo = {
  /**
   * Get all pitch drafts
   * Returns drafts ordered by creation date (newest first)
   *
   * @returns Array of pitch drafts
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<PitchDraft[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_drafts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get pitch drafts filtered by status
   *
   * @param status - Pitch draft status to filter by
   * @returns Array of pitch drafts with the specified status
   * @throws RepositoryError on database errors
   */
  getByStatus: async (status: PitchDraftStatus): Promise<PitchDraft[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_drafts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get pitch drafts filtered by template type
   *
   * @param templateType - Template type to filter by (null for custom)
   * @returns Array of pitch drafts with the specified template type
   * @throws RepositoryError on database errors
   */
  getByTemplateType: async (
    templateType: PitchTemplateType
  ): Promise<PitchDraft[]> => {
    const supabase = createClient();
    let query = supabase
      .from('pitch_drafts')
      .select('*')
      .order('created_at', { ascending: false });

    if (templateType === null) {
      query = query.is('template_type', null);
    } else {
      query = query.eq('template_type', templateType);
    }

    const { data, error } = await query;

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single pitch draft by ID
   *
   * @param id - Pitch draft ID
   * @returns Pitch draft
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<PitchDraft> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Pitch draft not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Get a pitch draft with all its sections and sources
   *
   * @param id - Pitch draft ID
   * @returns Pitch draft with sections
   * @throws RepositoryError if not found or access denied
   */
  getByIdWithSections: async (id: string): Promise<PitchDraftWithSections> => {
    const supabase = createClient();

    // Get the pitch draft
    const { data: draft, error: draftError } = await supabase
      .from('pitch_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (draftError) {
      throw mapPostgrestError(draftError);
    }

    if (!draft) {
      throw new RepositoryError(
        'Pitch draft not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    // Get sections with their sources
    const { data: sections, error: sectionsError } = await supabase
      .from('pitch_sections')
      .select(
        `
        *,
        pitch_section_sources (
          id,
          source_type,
          source_id,
          relevance_score
        )
      `
      )
      .eq('pitch_draft_id', id)
      .order('created_at', { ascending: true });

    if (sectionsError) {
      throw mapPostgrestError(sectionsError);
    }

    // Transform to match expected type
    const transformedSections = (sections ?? []).map((section) => ({
      id: section.id,
      pitch_draft_id: section.pitch_draft_id,
      section_type: section.section_type as PitchSectionType,
      content: section.content,
      ai_generated: section.ai_generated,
      user_edited: section.user_edited,
      confidence_score: section.confidence_score,
      created_at: section.created_at,
      updated_at: section.updated_at,
      sources: (section.pitch_section_sources ?? []).map(
        (source: {
          id: string;
          source_type: string;
          source_id: string;
          relevance_score: number | null;
        }) => ({
          id: source.id,
          source_type: source.source_type as PitchSourceType,
          source_id: source.source_id,
          relevance_score: source.relevance_score,
        })
      ),
    }));

    return {
      id: draft.id,
      title: draft.title,
      template_type: draft.template_type as PitchTemplateType,
      status: draft.status as PitchDraftStatus,
      exported_at: draft.exported_at,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
      sections: transformedSections,
    };
  },

  /**
   * Create a new pitch draft
   *
   * @param input - Pitch draft data to create
   * @returns Created pitch draft
   * @throws RepositoryError on validation or database errors
   */
  create: async (input: CreatePitchDraftInput): Promise<PitchDraft> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_drafts')
      .insert({
        title: input.title,
        template_type: input.template_type ?? null,
        status: input.status ?? 'draft',
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create pitch draft',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update a pitch draft
   *
   * @param id - Pitch draft ID to update
   * @param updates - Fields to update
   * @returns Updated pitch draft
   * @throws RepositoryError if not found or access denied
   */
  update: async (
    id: string,
    updates: UpdatePitchDraftInput
  ): Promise<PitchDraft> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_drafts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Pitch draft not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Update pitch draft status
   *
   * @param id - Pitch draft ID
   * @param status - New status value
   * @returns Updated pitch draft
   * @throws RepositoryError if not found or access denied
   */
  updateStatus: async (
    id: string,
    status: PitchDraftStatus
  ): Promise<PitchDraft> => {
    const updates: UpdatePitchDraftInput = { status };

    // If marking as exported, set exported_at timestamp
    if (status === 'exported') {
      updates.exported_at = new Date().toISOString();
    }

    return pitchDraftsRepo.update(id, updates);
  },

  /**
   * Permanently delete a pitch draft
   * WARNING: This cascades to sections and sources
   *
   * @param id - Pitch draft ID to delete
   * @throws RepositoryError if not found or access denied
   */
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pitch_drafts')
      .delete()
      .eq('id', id);

    if (error) {
      throw mapPostgrestError(error);
    }
  },
};

// Re-export types for consumers
export type {
  PitchDraft,
  PitchDraftStatus,
  PitchTemplateType,
  CreatePitchDraftInput,
  UpdatePitchDraftInput,
  PitchDraftWithSections,
};
