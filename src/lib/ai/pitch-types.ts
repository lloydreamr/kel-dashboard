/**
 * Pitch Content Generation Types
 *
 * Type definitions for AI-powered pitch content generation.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import type { PitchSectionType, PitchSourceType } from '@/types/pitch';

// ============================================================================
// Generation Request/Response Types
// ============================================================================

/**
 * Request body for pitch content generation API
 */
export interface GeneratePitchContentRequest {
  /** ID of the pitch draft to generate content for */
  pitch_draft_id: string;
  /** Type of section to generate */
  section_type: PitchSectionType;
  /** Optional context to focus the generation */
  context?: {
    /** Specific company IDs to focus on */
    company_ids?: string[];
    /** Specific product IDs to focus on */
    product_ids?: string[];
    /** Specific trend IDs to align with */
    trend_ids?: string[];
    /** Specific consumer segment IDs to target */
    consumer_ids?: string[];
  };
}

/**
 * Successful response from pitch content generation API
 */
export interface GeneratePitchContentResponse {
  success: true;
  /** Generated section data */
  section: {
    id: string;
    pitch_draft_id: string;
    section_type: PitchSectionType;
    content: string;
    ai_generated: boolean;
    user_edited: boolean;
    confidence_score: number | null;
    created_at: string;
    updated_at: string;
  };
  /** Sources used in generation */
  sources: Array<{
    id: string;
    source_type: PitchSourceType;
    source_id: string;
    relevance_score: number | null;
    /** Resolved source name for display */
    source_name: string;
  }>;
  /** Generation metadata */
  metadata: {
    model: string;
    tokens_used: number;
    generated_at: string;
  };
}

/**
 * Error response from pitch content generation API
 */
export interface GeneratePitchContentErrorResponse {
  success: false;
  error: string;
  /** Optional error code for client handling */
  code?: 'EMPTY_KNOWLEDGE_BASE' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'UNKNOWN';
}

// ============================================================================
// AI Output Schema Types
// ============================================================================

/**
 * Structured AI output for pitch section content
 *
 * This is the shape Claude returns via generateObject().
 */
export interface AIGeneratedPitchContent {
  /** The generated pitch content text */
  content: string;
  /** Confidence score based on evidence quality (0.0-1.0) */
  confidence_score: number;
  /** Sources referenced in the generation */
  sources: Array<{
    /** Type of MI entity */
    entity_type: 'company' | 'product' | 'consumer' | 'trend' | 'research';
    /** UUID of the source entity */
    entity_id: string;
    /** How relevant this source is (0.0-1.0) */
    relevance_score: number;
    /** Key data point used from this source */
    key_insight: string;
  }>;
  /** Reasoning for the generation (not persisted) */
  reasoning: string;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context aggregated for pitch generation
 *
 * Contains formatted knowledge base entities filtered for the section type.
 */
export interface PitchGenerationContext {
  /** Formatted context string for the prompt */
  formattedContext: string;
  /** Entity counts by type */
  entityCounts: {
    companies: number;
    products: number;
    consumers: number;
    trends: number;
    research: number;
  };
  /** Estimated token count */
  estimatedTokens: number;
  /** Whether context was truncated to fit budget */
  wasTruncated: boolean;
}

// ============================================================================
// Template Context Types (Story 18-4)
// ============================================================================

/**
 * Custom context weights for template-aware generation
 *
 * Used to override default section weights based on template configuration.
 */
export interface ContextWeightOverrides {
  companies?: number;
  products?: number;
  consumers?: number;
  trends?: number;
}

/**
 * Template context for prompt building
 *
 * Carries template-specific instructions for AI generation.
 */
export interface TemplatePromptContext {
  /** Additional prompt instructions from template (appended to section prompt) */
  promptModifier?: string;
  /** Tone to use in generation (affects language style) */
  tone?: 'formal' | 'conversational' | 'energetic';
}

// ============================================================================
// Source Resolution Types
// ============================================================================

/**
 * Resolved source with display name
 *
 * Used to show human-readable names for MI entities.
 */
export interface ResolvedSource {
  id: string;
  type: PitchSourceType;
  name: string;
}

/**
 * Map entity type from AI output to PitchSourceType
 */
export function mapEntityTypeToPitchSourceType(
  entityType: 'company' | 'product' | 'consumer' | 'trend' | 'research'
): PitchSourceType {
  const mapping: Record<typeof entityType, PitchSourceType> = {
    company: 'companies',
    product: 'products',
    consumer: 'consumers',
    trend: 'trends',
    research: 'research_docs',
  };
  return mapping[entityType];
}
