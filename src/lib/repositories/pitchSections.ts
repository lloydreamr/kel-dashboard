/**
 * Pitch Sections Repository
 *
 * All database operations for pitch sections and their sources.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access pitch sections.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { PitchSection, PitchSectionSource } from '@/types/database';
import type {
  PitchSectionType,
  PitchSourceType,
  CreatePitchSectionInput,
  UpdatePitchSectionInput,
  CreatePitchSectionSourceInput,
  PitchSectionWithSources,
} from '@/types/pitch';

/**
 * Pitch sections repository - handles all pitch section CRUD operations
 */
export const pitchSectionsRepo = {
  /**
   * Get all sections for a pitch draft
   *
   * @param pitchDraftId - Pitch draft ID
   * @returns Array of sections ordered by creation date
   * @throws RepositoryError on database errors
   */
  getByDraftId: async (pitchDraftId: string): Promise<PitchSection[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_sections')
      .select('*')
      .eq('pitch_draft_id', pitchDraftId)
      .order('created_at', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get all sections for a pitch draft with sources
   *
   * @param pitchDraftId - Pitch draft ID
   * @returns Array of sections with sources
   * @throws RepositoryError on database errors
   */
  getByDraftIdWithSources: async (
    pitchDraftId: string
  ): Promise<PitchSectionWithSources[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
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
      .eq('pitch_draft_id', pitchDraftId)
      .order('created_at', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    // Transform to match expected type
    return (data ?? []).map((section) => ({
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
  },

  /**
   * Get a single section by ID
   *
   * @param id - Section ID
   * @returns Pitch section
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<PitchSection> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_sections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Pitch section not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Get a single section by ID with sources
   *
   * @param id - Section ID
   * @returns Pitch section with sources
   * @throws RepositoryError if not found or access denied
   */
  getByIdWithSources: async (id: string): Promise<PitchSectionWithSources> => {
    const supabase = createClient();
    const { data, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Pitch section not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return {
      id: data.id,
      pitch_draft_id: data.pitch_draft_id,
      section_type: data.section_type as PitchSectionType,
      content: data.content,
      ai_generated: data.ai_generated,
      user_edited: data.user_edited,
      confidence_score: data.confidence_score,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sources: (data.pitch_section_sources ?? []).map(
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
    };
  },

  /**
   * Get section by draft ID and section type
   *
   * @param pitchDraftId - Pitch draft ID
   * @param sectionType - Section type
   * @returns Pitch section or null if not found
   * @throws RepositoryError on database errors
   */
  getByDraftAndType: async (
    pitchDraftId: string,
    sectionType: PitchSectionType
  ): Promise<PitchSection | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_sections')
      .select('*')
      .eq('pitch_draft_id', pitchDraftId)
      .eq('section_type', sectionType)
      .maybeSingle();

    if (error) {
      throw mapPostgrestError(error);
    }

    return data;
  },

  /**
   * Create a new pitch section
   *
   * @param input - Section data to create
   * @returns Created pitch section
   * @throws RepositoryError on validation or database errors
   */
  create: async (input: CreatePitchSectionInput): Promise<PitchSection> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_sections')
      .insert({
        pitch_draft_id: input.pitch_draft_id,
        section_type: input.section_type,
        content: input.content,
        ai_generated: input.ai_generated ?? true,
        user_edited: input.user_edited ?? false,
        confidence_score: input.confidence_score ?? null,
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create pitch section',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update a pitch section
   *
   * @param id - Section ID to update
   * @param updates - Fields to update
   * @returns Updated pitch section
   * @throws RepositoryError if not found or access denied
   */
  update: async (
    id: string,
    updates: UpdatePitchSectionInput
  ): Promise<PitchSection> => {
    const supabase = createClient();

    // If content is being updated, mark as user_edited
    const updateData = { ...updates };
    if (updates.content !== undefined) {
      updateData.user_edited = true;
    }

    const { data, error } = await supabase
      .from('pitch_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Pitch section not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Create multiple pitch sections at once (batch create).
   * Used for template-based pitch creation with pre-defined sections.
   *
   * @param pitchDraftId - Pitch draft ID to create sections for
   * @param sections - Array of section data (without pitch_draft_id)
   * @returns Array of created pitch sections
   * @throws RepositoryError on validation or database errors
   */
  createBatch: async (
    pitchDraftId: string,
    sections: Array<Omit<CreatePitchSectionInput, 'pitch_draft_id'>>
  ): Promise<PitchSection[]> => {
    if (sections.length === 0) {
      return [];
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_sections')
      .insert(
        sections.map((section) => ({
          pitch_draft_id: pitchDraftId,
          section_type: section.section_type,
          content: section.content,
          ai_generated: section.ai_generated ?? false, // Template sections aren't AI-generated yet
          user_edited: section.user_edited ?? false,
          confidence_score: section.confidence_score ?? null,
        }))
      )
      .select();

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Create or update a section (upsert by draft + type)
   * Used when regenerating content for an existing section type
   *
   * @param input - Section data to create or update
   * @returns Created or updated pitch section
   * @throws RepositoryError on validation or database errors
   */
  upsert: async (input: CreatePitchSectionInput): Promise<PitchSection> => {
    // Check if section already exists
    const existing = await pitchSectionsRepo.getByDraftAndType(
      input.pitch_draft_id,
      input.section_type
    );

    if (existing) {
      // Update existing section
      return pitchSectionsRepo.update(existing.id, {
        content: input.content,
        user_edited: false, // Reset since this is a regeneration
        confidence_score: input.confidence_score,
      });
    }

    // Create new section
    return pitchSectionsRepo.create(input);
  },

  /**
   * Permanently delete a pitch section
   * WARNING: This cascades to sources
   *
   * @param id - Section ID to delete
   * @throws RepositoryError if not found or access denied
   */
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pitch_sections')
      .delete()
      .eq('id', id);

    if (error) {
      throw mapPostgrestError(error);
    }
  },
};

/**
 * Pitch section sources repository - handles source tracking
 */
export const pitchSectionSourcesRepo = {
  /**
   * Get all sources for a section
   *
   * @param sectionId - Section ID
   * @returns Array of sources
   * @throws RepositoryError on database errors
   */
  getBySectionId: async (sectionId: string): Promise<PitchSectionSource[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_section_sources')
      .select('*')
      .eq('section_id', sectionId)
      .order('relevance_score', { ascending: false, nullsFirst: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Create a new section source
   *
   * @param input - Source data to create
   * @returns Created section source
   * @throws RepositoryError on validation or database errors
   */
  create: async (
    input: CreatePitchSectionSourceInput
  ): Promise<PitchSectionSource> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_section_sources')
      .insert({
        section_id: input.section_id,
        source_type: input.source_type,
        source_id: input.source_id,
        relevance_score: input.relevance_score ?? null,
      })
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create section source',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Create multiple section sources at once
   *
   * @param inputs - Array of source data to create
   * @returns Array of created section sources
   * @throws RepositoryError on validation or database errors
   */
  createMany: async (
    inputs: CreatePitchSectionSourceInput[]
  ): Promise<PitchSectionSource[]> => {
    if (inputs.length === 0) {
      return [];
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('pitch_section_sources')
      .insert(
        inputs.map((input) => ({
          section_id: input.section_id,
          source_type: input.source_type,
          source_id: input.source_id,
          relevance_score: input.relevance_score ?? null,
        }))
      )
      .select();

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Delete all sources for a section
   * Used when regenerating content
   *
   * @param sectionId - Section ID
   * @throws RepositoryError on database errors
   */
  deleteBySectionId: async (sectionId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pitch_section_sources')
      .delete()
      .eq('section_id', sectionId);

    if (error) {
      throw mapPostgrestError(error);
    }
  },

  /**
   * Delete a single source
   *
   * @param id - Source ID to delete
   * @throws RepositoryError if not found or access denied
   */
  delete: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pitch_section_sources')
      .delete()
      .eq('id', id);

    if (error) {
      throw mapPostgrestError(error);
    }
  },

  /**
   * Replace all sources for a section
   * Deletes existing and creates new ones
   *
   * @param sectionId - Section ID
   * @param sources - New sources to create
   * @returns Array of created section sources
   * @throws RepositoryError on database errors
   */
  replaceForSection: async (
    sectionId: string,
    sources: Omit<CreatePitchSectionSourceInput, 'section_id'>[]
  ): Promise<PitchSectionSource[]> => {
    // Delete existing sources
    await pitchSectionSourcesRepo.deleteBySectionId(sectionId);

    // Create new sources
    if (sources.length === 0) {
      return [];
    }

    return pitchSectionSourcesRepo.createMany(
      sources.map((source) => ({
        ...source,
        section_id: sectionId,
      }))
    );
  },
};

// Re-export types for consumers
export type {
  PitchSection,
  PitchSectionSource,
  PitchSectionType,
  PitchSourceType,
  CreatePitchSectionInput,
  UpdatePitchSectionInput,
  CreatePitchSectionSourceInput,
  PitchSectionWithSources,
};
