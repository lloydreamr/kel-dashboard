/**
 * Milestone Types
 *
 * Business types for the milestones and milestone_notes tables.
 * These extend the database types with domain-specific interfaces.
 */

import type { Database } from './database';

// Re-export enum types from database
export type ClarityCategory = Database['public']['Enums']['clarity_category'];
export type MilestoneStatus = Database['public']['Enums']['milestone_status'];

// Database row types
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type MilestoneNote = Database['public']['Tables']['milestone_notes']['Row'];

// Progress calculation result
export interface MilestoneProgress {
  total: number;
  approved: number;
  percentage: number;
}

// Input types for creating/updating notes
export interface CreateMilestoneNoteInput {
  milestone_id: string;
  content: string;
}

export interface UpdateMilestoneNoteInput {
  content: string;
}

// Update types for milestones
export interface UpdateMilestoneStatusInput {
  status: MilestoneStatus;
}

export interface MarkMilestoneCompleteInput {
  completed_by: string;
}
