/**
 * Opportunity Generation Types
 *
 * Type definitions for AI-powered opportunity generation.
 * Used by the generate-opportunities API endpoint.
 *
 * Story 16-2: AI Opportunity Generation Job
 */

import type { OpportunityCategory, SupportingEvidence } from '@/lib/repositories/opportunities';

/**
 * A single opportunity identified by AI analysis
 * Includes all fields needed for database insertion plus reasoning for transparency
 */
export interface GeneratedOpportunity {
  /** Concise, actionable opportunity name */
  title: string;
  /** 2-3 sentence explanation of the opportunity */
  description: string;
  /** Category of the opportunity */
  category: OpportunityCategory;
  /** Confidence score (0.0 to 1.0) based on evidence strength */
  confidence_score: number;
  /** Links to knowledge base entities that support this opportunity */
  supporting_evidence: SupportingEvidence[];
  /** AI's reasoning for identifying this opportunity (for transparency, not persisted) */
  reasoning: string;
}

/**
 * Complete result from AI opportunity analysis
 * Returned by Claude via generateObject()
 */
export interface OpportunityAnalysisResult {
  /** Array of identified opportunities */
  opportunities: GeneratedOpportunity[];
  /** Summary statistics from the analysis */
  analysis_summary: {
    /** Total number of knowledge base entities analyzed */
    total_entities_analyzed: number;
    /** Count of opportunities by category */
    opportunities_by_category: Record<OpportunityCategory, number>;
  };
}

/**
 * Context structure for building the analysis prompt
 * Contains all knowledge base entities formatted for AI consumption
 */
export interface GenerationContext {
  /** Formatted context string with all entities */
  formattedContext: string;
  /** Count of entities by type */
  entityCounts: {
    companies: number;
    products: number;
    consumers: number;
    trends: number;
    research: number;
  };
  /** Total estimated token count for the context */
  estimatedTokens: number;
  /** Whether context was truncated to fit token budget */
  wasTruncated: boolean;
}

/**
 * Request body for the generate-opportunities API endpoint
 */
export interface GenerateOpportunitiesRequest {
  /** If true, delete existing opportunities before generating new ones */
  regenerate?: boolean;
}

/**
 * Success response from the generate-opportunities API endpoint
 */
export interface GenerateOpportunitiesResponse {
  /** Whether the operation succeeded */
  success: true;
  /** Number of opportunities generated */
  generated: number;
  /** Count by category */
  breakdown: Record<OpportunityCategory, number>;
}

/**
 * Error response from the generate-opportunities API endpoint
 */
export interface GenerateOpportunitiesErrorResponse {
  /** Whether the operation succeeded */
  success: false;
  /** User-friendly error message */
  error: string;
}
