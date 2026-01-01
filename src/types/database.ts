/**
 * Supabase Database Types
 *
 * Base structure from: npm run db:types
 * MANUAL EDITS ALLOWED for union type literals (e.g., 'maho' | 'kel')
 * Auto-generation uses `string` which breaks type safety.
 *
 * To regenerate after schema changes:
 * 1. Make changes in Supabase dashboard
 * 2. Run: npm run db:types
 * 3. Restore union literals manually if overwritten
 *
 * @see https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      decisions: {
        Row: {
          id: string;
          question_id: string;
          decision_type: 'approved' | 'approved_with_constraint' | 'explore_alternatives';
          constraints: Json | null;
          constraint_context: string | null;
          reasoning: string | null;
          incorporated_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          decision_type: 'approved' | 'approved_with_constraint' | 'explore_alternatives';
          constraints?: Json | null;
          constraint_context?: string | null;
          reasoning?: string | null;
          incorporated_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          decision_type?: 'approved' | 'approved_with_constraint' | 'explore_alternatives';
          constraints?: Json | null;
          constraint_context?: string | null;
          reasoning?: string | null;
          incorporated_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'decisions_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: true;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'decisions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      evidence: {
        Row: {
          id: string;
          question_id: string;
          title: string;
          url: string;
          section_anchor: string | null;
          excerpt: string | null;
          created_at: string;
          created_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          title: string;
          url: string;
          section_anchor?: string | null;
          excerpt?: string | null;
          created_at?: string;
          created_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          title?: string;
          url?: string;
          section_anchor?: string | null;
          excerpt?: string | null;
          created_at?: string;
          created_by?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'evidence_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'evidence_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'maho' | 'kel';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'maho' | 'kel';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'maho' | 'kel';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: 'market' | 'product' | 'distribution';
          recommendation: string | null;
          recommendation_rationale: string | null;
          status:
            | 'draft'
            | 'ready_for_kel'
            | 'approved'
            | 'exploring_alternatives'
            | 'archived';
          created_by: string;
          created_at: string;
          updated_at: string;
          viewed_by_kel_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: 'market' | 'product' | 'distribution';
          recommendation?: string | null;
          recommendation_rationale?: string | null;
          status?:
            | 'draft'
            | 'ready_for_kel'
            | 'approved'
            | 'exploring_alternatives'
            | 'archived';
          created_by: string;
          created_at?: string;
          updated_at?: string;
          viewed_by_kel_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: 'market' | 'product' | 'distribution';
          recommendation?: string | null;
          recommendation_rationale?: string | null;
          status?:
            | 'draft'
            | 'ready_for_kel'
            | 'approved'
            | 'exploring_alternatives'
            | 'archived';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          viewed_by_kel_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      milestones: {
        Row: {
          id: string;
          category: Database['public']['Enums']['clarity_category'];
          status: Database['public']['Enums']['milestone_status'];
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: Database['public']['Enums']['clarity_category'];
          status?: Database['public']['Enums']['milestone_status'];
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: Database['public']['Enums']['clarity_category'];
          status?: Database['public']['Enums']['milestone_status'];
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      milestone_notes: {
        Row: {
          id: string;
          milestone_id: string;
          content: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          content: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          milestone_id?: string;
          content?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'milestone_notes_milestone_id_fkey';
            columns: ['milestone_id'];
            isOneToOne: false;
            referencedRelation: 'milestones';
            referencedColumns: ['id'];
          },
        ];
      };
      competitor_data: {
        Row: {
          id: string;
          name: string;
          price_score: number;
          quality_score: number;
          category: string | null;
          notes: string | null;
          is_kel_position: boolean | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price_score: number;
          quality_score: number;
          category?: string | null;
          notes?: string | null;
          is_kel_position?: boolean | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price_score?: number;
          quality_score?: number;
          category?: string | null;
          notes?: string | null;
          is_kel_position?: boolean | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_valid_constraints_array: {
        Args: { constraints: Json };
        Returns: boolean;
      };
    };
    Enums: {
      clarity_category: 'market' | 'product' | 'distribution';
      milestone_status: 'not_started' | 'in_progress' | 'complete';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience exports
export type Profile = Tables<'profiles'>;
export type ProfileInsert = InsertTables<'profiles'>;
export type ProfileUpdate = UpdateTables<'profiles'>;

// Question types
export type Question = Tables<'questions'>;
export type QuestionInsert = InsertTables<'questions'>;
export type QuestionUpdate = UpdateTables<'questions'>;

// Evidence types
export type Evidence = Tables<'evidence'>;
export type EvidenceInsert = InsertTables<'evidence'>;
export type EvidenceUpdate = UpdateTables<'evidence'>;

// Decision types
export type Decision = Tables<'decisions'>;
export type DecisionInsert = InsertTables<'decisions'>;
export type DecisionUpdate = UpdateTables<'decisions'>;

// Milestone types
export type Milestone = Tables<'milestones'>;
export type MilestoneInsert = InsertTables<'milestones'>;
export type MilestoneUpdate = UpdateTables<'milestones'>;

// Milestone Note types
export type MilestoneNote = Tables<'milestone_notes'>;
export type MilestoneNoteInsert = InsertTables<'milestone_notes'>;
export type MilestoneNoteUpdate = UpdateTables<'milestone_notes'>;

// Competitor Data types
export type CompetitorDataPoint = Tables<'competitor_data'>;
export type CompetitorDataPointInsert = InsertTables<'competitor_data'>;
export type CompetitorDataPointUpdate = UpdateTables<'competitor_data'>;
