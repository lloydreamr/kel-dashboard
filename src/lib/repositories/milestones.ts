/**
 * Milestones Repository
 *
 * All database operations for clarity milestones and progress tracking.
 * Uses browser client for client-side operations.
 * RLS ensures only Maho and Kel can access milestones.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type {
  Milestone,
  MilestoneNote,
  ClarityCategory,
  MilestoneStatus,
  MilestoneProgress,
  CreateMilestoneNoteInput,
  UpdateMilestoneNoteInput,
} from '@/types';

/**
 * Milestones repository - handles all milestone CRUD operations
 */
export const milestonesRepo = {
  /**
   * Get all milestones (always returns 3 rows)
   * Returns milestones ordered by category
   *
   * @returns Array of all milestones
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<Milestone[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Get a single milestone by ID
   *
   * @param id - Milestone ID
   * @returns Milestone
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Milestone> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Milestone not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Get milestone by category (unique constraint ensures one per category)
   *
   * @param category - Clarity category
   * @returns Milestone for the specified category
   * @throws RepositoryError if not found or access denied
   */
  getByCategory: async (category: ClarityCategory): Promise<Milestone> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('category', category)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        `Milestone not found for category: ${category}`,
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Update milestone status
   *
   * @param id - Milestone ID
   * @param status - New status
   * @returns Updated milestone
   * @throws RepositoryError on database errors
   */
  updateStatus: async (
    id: string,
    status: MilestoneStatus
  ): Promise<Milestone> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestones')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Milestone not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Mark milestone as complete
   * Sets status to 'complete', completed_at to now, and completed_by to userId
   *
   * @param id - Milestone ID
   * @param userId - User ID marking it complete
   * @returns Updated milestone
   * @throws RepositoryError on database errors
   */
  markComplete: async (id: string, userId: string): Promise<Milestone> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestones')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Milestone not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Calculate progress for a clarity category
   * Queries the questions table to count approved vs total questions
   *
   * ASSUMPTION: questions.category enum values match clarity_category enum
   * If question categories diverge from milestone categories, counts will be incorrect
   *
   * @param category - Clarity category
   * @returns Progress object with total, approved, and percentage
   * @throws RepositoryError on database errors
   */
  getProgress: async (category: ClarityCategory): Promise<MilestoneProgress> => {
    const supabase = createClient();

    // Get total questions in category (exclude archived)
    const { count: total, error: totalError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)
      .neq('status', 'archived');

    if (totalError) {
      throw mapPostgrestError(totalError);
    }

    // Get approved questions in category
    const { count: approved, error: approvedError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)
      .eq('status', 'approved');

    if (approvedError) {
      throw mapPostgrestError(approvedError);
    }

    // Calculate percentage (avoid division by zero)
    const percentage =
      total && total > 0 ? Math.round(((approved ?? 0) / total) * 100) : 0;

    return {
      total: total ?? 0,
      approved: approved ?? 0,
      percentage,
    };
  },
};

/**
 * Milestone Notes repository - handles all milestone note CRUD operations
 */
export const milestoneNotesRepo = {
  /**
   * Get all notes for a milestone
   * Returns notes ordered by creation date (newest first)
   *
   * @param milestoneId - Milestone ID
   * @returns Array of notes
   * @throws RepositoryError on database errors
   */
  getNotesByMilestone: async (milestoneId: string): Promise<MilestoneNote[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestone_notes')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: false });

    if (error) {
      throw mapPostgrestError(error);
    }

    return data ?? [];
  },

  /**
   * Create a new milestone note
   *
   * @param input - Create note input
   * @returns Created note
   * @throws RepositoryError on database errors
   */
  createNote: async (
    input: CreateMilestoneNoteInput
  ): Promise<MilestoneNote> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestone_notes')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Failed to create milestone note',
        RepositoryErrorCode.UNKNOWN
      );
    }

    return data;
  },

  /**
   * Update an existing milestone note
   *
   * @param noteId - Note ID
   * @param input - Update input
   * @returns Updated note
   * @throws RepositoryError on database errors
   */
  updateNote: async (
    noteId: string,
    input: UpdateMilestoneNoteInput
  ): Promise<MilestoneNote> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('milestone_notes')
      .update(input)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Milestone note not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Delete a milestone note
   *
   * @param noteId - Note ID
   * @throws RepositoryError on database errors
   */
  deleteNote: async (noteId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('milestone_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      throw mapPostgrestError(error);
    }
  },
};
