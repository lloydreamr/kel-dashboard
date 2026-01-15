/**
 * Pitch Domain Types
 *
 * Re-exports database types and defines domain-specific types
 * for working with AI-assisted pitch content generation.
 */

// Re-export database types for convenience
export type {
  PitchDraft,
  PitchDraftInsert,
  PitchDraftUpdate,
  PitchSection,
  PitchSectionInsert,
  PitchSectionUpdate,
  PitchSectionSource,
  PitchSectionSourceInsert,
} from './database';

// ============================================================================
// Pitch Draft Types
// ============================================================================

/**
 * Valid pitch draft status values.
 * - draft: Initial state, content being prepared/refined
 * - ready: Content is finalized and ready for export
 * - exported: Pitch has been exported to PDF
 */
export type PitchDraftStatus = 'draft' | 'ready' | 'exported';

/**
 * Valid pitch template types.
 * - mid_size: Mid-size distributor pitch template
 * - regional: Regional distributor pitch template
 * - wofex_booth: WOFEX trade show booth pitch template
 * - null: Custom pitch (no template)
 */
export type PitchTemplateType = 'mid_size' | 'regional' | 'wofex_booth' | null;

/**
 * Array of all valid pitch draft statuses for validation.
 */
export const PITCH_DRAFT_STATUSES: PitchDraftStatus[] = [
  'draft',
  'ready',
  'exported',
];

/**
 * Array of all valid pitch template types for validation.
 */
export const PITCH_TEMPLATE_TYPES: NonNullable<PitchTemplateType>[] = [
  'mid_size',
  'regional',
  'wofex_booth',
];

/**
 * Human-readable labels for pitch template types.
 */
export const TEMPLATE_TYPE_LABELS: Record<NonNullable<PitchTemplateType>, string> = {
  mid_size: 'Mid-Size Distributor',
  regional: 'Regional Distributor',
  wofex_booth: 'WOFEX Booth Pitch',
};

/**
 * Input type for creating a new pitch draft.
 * Excludes auto-generated fields (id, timestamps, exported_at).
 */
export interface CreatePitchDraftInput {
  title: string;
  template_type?: PitchTemplateType;
  status?: PitchDraftStatus;
}

/**
 * Input type for updating a pitch draft.
 * All fields are optional.
 */
export interface UpdatePitchDraftInput {
  title?: string;
  template_type?: PitchTemplateType;
  status?: PitchDraftStatus;
  exported_at?: string | null;
}

// ============================================================================
// Pitch Section Types
// ============================================================================

/**
 * Valid pitch section type values.
 * - market_opportunity: Market opportunity statement
 * - competitive_positioning: Competitive positioning section
 * - trend_alignment: Trend alignment section
 */
export type PitchSectionType =
  | 'market_opportunity'
  | 'competitive_positioning'
  | 'trend_alignment';

/**
 * Array of all valid pitch section types for validation.
 */
export const PITCH_SECTION_TYPES: PitchSectionType[] = [
  'market_opportunity',
  'competitive_positioning',
  'trend_alignment',
];

/**
 * Human-readable labels for pitch section types.
 */
export const SECTION_TYPE_LABELS: Record<PitchSectionType, string> = {
  market_opportunity: 'Market Opportunity',
  competitive_positioning: 'Competitive Positioning',
  trend_alignment: 'Trend Alignment',
};

/**
 * Descriptions for each pitch section type.
 */
export const SECTION_TYPE_DESCRIPTIONS: Record<PitchSectionType, string> = {
  market_opportunity:
    'Market size, growth potential, and white space opportunities',
  competitive_positioning:
    'How Kel products differentiate from existing offerings',
  trend_alignment:
    'Alignment with current consumer and industry trends',
};

/**
 * Input type for creating a new pitch section.
 * Excludes auto-generated fields (id, timestamps).
 */
export interface CreatePitchSectionInput {
  pitch_draft_id: string;
  section_type: PitchSectionType;
  content: string;
  ai_generated?: boolean;
  user_edited?: boolean;
  confidence_score?: number | null;
}

/**
 * Input type for updating a pitch section.
 * All fields are optional.
 */
export interface UpdatePitchSectionInput {
  content?: string;
  user_edited?: boolean;
  confidence_score?: number | null;
}

// ============================================================================
// Pitch Section Source Types
// ============================================================================

/**
 * Valid source types for pitch section sources.
 * Maps to MI entity tables.
 */
export type PitchSourceType =
  | 'companies'
  | 'products'
  | 'consumers'
  | 'trends'
  | 'research_docs';

/**
 * Array of all valid pitch source types for validation.
 */
export const PITCH_SOURCE_TYPES: PitchSourceType[] = [
  'companies',
  'products',
  'consumers',
  'trends',
  'research_docs',
];

/**
 * Human-readable labels for pitch source types.
 */
export const SOURCE_TYPE_LABELS: Record<PitchSourceType, string> = {
  companies: 'Company',
  products: 'Product',
  consumers: 'Consumer Segment',
  trends: 'Trend',
  research_docs: 'Research Document',
};

/**
 * Input type for creating a pitch section source.
 * Excludes auto-generated fields (id, created_at).
 */
export interface CreatePitchSectionSourceInput {
  section_id: string;
  source_type: PitchSourceType;
  source_id: string;
  relevance_score?: number | null;
}

// ============================================================================
// Composite Types for UI
// ============================================================================

/**
 * Pitch section with its sources for display.
 */
export interface PitchSectionWithSources {
  id: string;
  pitch_draft_id: string;
  section_type: PitchSectionType;
  content: string;
  ai_generated: boolean;
  user_edited: boolean;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  sources: Array<{
    id: string;
    source_type: PitchSourceType;
    source_id: string;
    relevance_score: number | null;
    // Resolved source name for display
    source_name?: string;
  }>;
}

/**
 * Pitch draft with all its sections for complete view.
 */
export interface PitchDraftWithSections {
  id: string;
  title: string;
  template_type: PitchTemplateType;
  status: PitchDraftStatus;
  exported_at: string | null;
  created_at: string;
  updated_at: string;
  sections: PitchSectionWithSources[];
}

// ============================================================================
// AI Generation Types
// ============================================================================

/**
 * Request type for AI pitch content generation.
 */
export interface GeneratePitchContentRequest {
  pitch_draft_id: string;
  section_type: PitchSectionType;
  /** Optional context to guide generation */
  context?: {
    /** Specific companies to focus on */
    company_ids?: string[];
    /** Specific products to focus on */
    product_ids?: string[];
    /** Specific trends to align with */
    trend_ids?: string[];
    /** Specific consumer segments to target */
    consumer_ids?: string[];
  };
}

/**
 * Response type for AI pitch content generation.
 */
export interface GeneratePitchContentResponse {
  section: PitchSectionWithSources;
  /** Generation metadata */
  metadata: {
    /** Model used for generation */
    model: string;
    /** Token usage */
    tokens_used: number;
    /** Generation timestamp */
    generated_at: string;
  };
}

/**
 * Confidence level thresholds for display.
 */
export const CONFIDENCE_THRESHOLDS = {
  high: 0.8,
  medium: 0.5,
  low: 0,
} as const;

/**
 * Get confidence level label based on score.
 */
export function getConfidenceLevel(
  score: number | null
): 'high' | 'medium' | 'low' | 'unknown' {
  if (score === null) return 'unknown';
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}
