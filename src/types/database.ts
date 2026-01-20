export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          category: string | null
          created_at: string
          distribution_reach: string | null
          id: string
          market_share: number | null
          name: string
          products: string[] | null
          raw_content: string | null
          revenue_estimate: string | null
          source_file: string | null
          strengths: string[] | null
          updated_at: string
          weaknesses: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          distribution_reach?: string | null
          id?: string
          market_share?: number | null
          name: string
          products?: string[] | null
          raw_content?: string | null
          revenue_estimate?: string | null
          source_file?: string | null
          strengths?: string[] | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string
          distribution_reach?: string | null
          id?: string
          market_share?: number | null
          name?: string
          products?: string[] | null
          raw_content?: string | null
          revenue_estimate?: string | null
          source_file?: string | null
          strengths?: string[] | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      competitor_data: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          id: string
          is_kel_position: boolean | null
          name: string
          notes: string | null
          price_score: number
          quality_score: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_kel_position?: boolean | null
          name: string
          notes?: string | null
          price_score: number
          quality_score: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_kel_position?: boolean | null
          name?: string
          notes?: string | null
          price_score?: number
          quality_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      consumers: {
        Row: {
          behaviors: string[] | null
          created_at: string
          demographics: Json | null
          id: string
          pain_points: string[] | null
          preferences: string[] | null
          segment_name: string
          source_file: string | null
          updated_at: string
        }
        Insert: {
          behaviors?: string[] | null
          created_at?: string
          demographics?: Json | null
          id?: string
          pain_points?: string[] | null
          preferences?: string[] | null
          segment_name: string
          source_file?: string | null
          updated_at?: string
        }
        Update: {
          behaviors?: string[] | null
          created_at?: string
          demographics?: Json | null
          id?: string
          pain_points?: string[] | null
          preferences?: string[] | null
          segment_name?: string
          source_file?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          constraint_context: string | null
          constraints: Json | null
          created_at: string
          created_by: string
          decision_type: string
          id: string
          incorporated_at: string | null
          question_id: string
          reasoning: string | null
          updated_at: string
        }
        Insert: {
          constraint_context?: string | null
          constraints?: Json | null
          created_at?: string
          created_by: string
          decision_type: string
          id?: string
          incorporated_at?: string | null
          question_id: string
          reasoning?: string | null
          updated_at?: string
        }
        Update: {
          constraint_context?: string | null
          constraints?: Json | null
          created_at?: string
          created_by?: string
          decision_type?: string
          id?: string
          incorporated_at?: string | null
          question_id?: string
          reasoning?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          document_id: string
          document_type: string
          embedding: string
          id: string
          token_count: number
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          document_id: string
          document_type: string
          embedding: string
          id?: string
          token_count: number
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          document_id?: string
          document_type?: string
          embedding?: string
          id?: string
          token_count?: number
        }
        Relationships: []
      }
      entity_connections: {
        Row: {
          created_at: string
          id: string
          relationship: string | null
          source_id: string
          source_type: string
          strength: number | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship?: string | null
          source_id: string
          source_type: string
          strength?: number | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship?: string | null
          source_id?: string
          source_type?: string
          strength?: number | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          created_at: string
          created_by: string
          excerpt: string | null
          id: string
          image_url: string | null
          question_id: string | null
          section_anchor: string | null
          source_type: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          question_id?: string | null
          section_anchor?: string | null
          source_type?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          question_id?: string | null
          section_anchor?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          milestone_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          id?: string
          milestone_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          milestone_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_notes_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          category: Database["public"]["Enums"]["clarity_category"]
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["clarity_category"]
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["clarity_category"]
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          flavor_profile: string[] | null
          id: string
          market_position: string | null
          name: string
          price_point: number | null
          price_tier: string | null
          source_file: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          flavor_profile?: string[] | null
          id?: string
          market_position?: string | null
          name: string
          price_point?: number | null
          price_tier?: string | null
          source_file?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          flavor_profile?: string[] | null
          id?: string
          market_position?: string | null
          name?: string
          price_point?: number | null
          price_tier?: string | null
          source_file?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          recommendation: string | null
          recommendation_rationale: string | null
          status: string
          title: string
          updated_at: string
          viewed_by_kel_at: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          recommendation?: string | null
          recommendation_rationale?: string | null
          status?: string
          title: string
          updated_at?: string
          viewed_by_kel_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          recommendation?: string | null
          recommendation_rationale?: string | null
          status?: string
          title?: string
          updated_at?: string
          viewed_by_kel_at?: string | null
        }
        Relationships: []
      }
      research_docs: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          source_file: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          source_file?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          source_file?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          confidence_score: number
          supporting_evidence: Json
          status: string
          generated_at: string
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          confidence_score: number
          supporting_evidence?: Json
          status?: string
          generated_at?: string
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          confidence_score?: number
          supporting_evidence?: Json
          status?: string
          generated_at?: string
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pitch_drafts: {
        Row: {
          id: string
          title: string
          template_type: string | null
          status: string
          exported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          template_type?: string | null
          status?: string
          exported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          template_type?: string | null
          status?: string
          exported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pitch_section_sources: {
        Row: {
          id: string
          section_id: string
          source_type: string
          source_id: string
          relevance_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          source_type: string
          source_id: string
          relevance_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          source_type?: string
          source_id?: string
          relevance_score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_section_sources_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "pitch_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_sections: {
        Row: {
          id: string
          pitch_draft_id: string
          section_type: string
          content: string
          ai_generated: boolean
          user_edited: boolean
          confidence_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pitch_draft_id: string
          section_type: string
          content: string
          ai_generated?: boolean
          user_edited?: boolean
          confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pitch_draft_id?: string
          section_type?: string
          content?: string
          ai_generated?: boolean
          user_edited?: boolean
          confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_sections_pitch_draft_id_fkey"
            columns: ["pitch_draft_id"]
            isOneToOne: false
            referencedRelation: "pitch_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      trends: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          growth_rate: string | null
          id: string
          name: string
          source_file: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          growth_rate?: string | null
          id?: string
          name: string
          source_file?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          growth_rate?: string | null
          id?: string
          name?: string
          source_file?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_valid_constraints_array: {
        Args: { constraints: Json }
        Returns: boolean
      }
      match_embeddings: {
        Args: {
          filter_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          document_id: string
          document_type: string
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      clarity_category: "market" | "product" | "distribution"
      milestone_status: "not_started" | "in_progress" | "complete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      clarity_category: ["market", "product", "distribution"],
      milestone_status: ["not_started", "in_progress", "complete"],
    },
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Type Aliases
// These provide shorter names for commonly used table types
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use TablesInsert<'tablename'> instead */
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** @deprecated Use TablesUpdate<'tablename'> instead */
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Profile types
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

// Question types
export type Question = Tables<'questions'>;
export type QuestionInsert = TablesInsert<'questions'>;
export type QuestionUpdate = TablesUpdate<'questions'>;

// Milestone types
export type Milestone = Tables<'milestones'>;
export type MilestoneInsert = TablesInsert<'milestones'>;
export type MilestoneUpdate = TablesUpdate<'milestones'>;

// Milestone note types
export type MilestoneNote = Tables<'milestone_notes'>;
export type MilestoneNoteInsert = TablesInsert<'milestone_notes'>;
export type MilestoneNoteUpdate = TablesUpdate<'milestone_notes'>;

// Competitor data types
export type CompetitorDataPoint = Tables<'competitor_data'>;
export type CompetitorDataPointInsert = TablesInsert<'competitor_data'>;
export type CompetitorDataPointUpdate = TablesUpdate<'competitor_data'>;

// Evidence types
export type Evidence = Tables<'evidence'>;
export type EvidenceInsert = TablesInsert<'evidence'>;
export type EvidenceUpdate = TablesUpdate<'evidence'>;

// Decision types
export type Decision = Tables<'decisions'>;
export type DecisionInsert = TablesInsert<'decisions'>;
export type DecisionUpdate = TablesUpdate<'decisions'>;

// Pitch draft types
export type PitchDraft = Tables<'pitch_drafts'>;
export type PitchDraftInsert = TablesInsert<'pitch_drafts'>;
export type PitchDraftUpdate = TablesUpdate<'pitch_drafts'>;

// Pitch section types
export type PitchSection = Tables<'pitch_sections'>;
export type PitchSectionInsert = TablesInsert<'pitch_sections'>;
export type PitchSectionUpdate = TablesUpdate<'pitch_sections'>;

// Pitch section source types
export type PitchSectionSource = Tables<'pitch_section_sources'>;
export type PitchSectionSourceInsert = TablesInsert<'pitch_section_sources'>;
