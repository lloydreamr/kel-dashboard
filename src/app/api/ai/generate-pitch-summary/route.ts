/**
 * AI Pitch Summary Generation API Route
 *
 * POST /api/ai/generate-pitch-summary
 *
 * Generates an AI-powered executive summary for a pitch draft:
 * 1. Validates request and authenticates user
 * 2. Fetches all pitch sections for context
 * 3. Calls Claude with structured output schema
 * 4. Returns ephemeral summary (not persisted to DB)
 *
 * Story 18-3: Export with AI Summary
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

import type { PitchSectionType } from '@/types/pitch';

// ============================================================================
// Types
// ============================================================================

/**
 * Request body for pitch summary generation
 */
export interface GeneratePitchSummaryRequest {
  /** ID of the pitch draft to generate summary for */
  pitch_draft_id: string;
}

/**
 * Successful response from pitch summary generation
 */
export interface GeneratePitchSummaryResponse {
  success: true;
  /** Generated executive summary (2-3 sentences, max 300 chars) */
  summary: string;
  /** ISO timestamp of generation */
  generated_at: string;
  /** Generation metadata */
  metadata: {
    /** Model used for generation */
    model: string;
    /** Number of pitch sections analyzed */
    sections_analyzed: number;
  };
}

/**
 * Error response from pitch summary generation
 */
export interface GeneratePitchSummaryErrorResponse {
  success: false;
  error: string;
  /** Error code for client handling */
  code?: 'VALIDATION_ERROR' | 'EMPTY_PITCH' | 'TIMEOUT' | 'RATE_LIMIT' | 'UNKNOWN';
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum retries for Anthropic API calls (handles rate limits)
 */
const MAX_RETRIES = 3;

/**
 * Request timeout in milliseconds (10 seconds for short summary)
 */
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Section type labels for prompt context
 */
const SECTION_LABELS: Record<PitchSectionType, string> = {
  market_opportunity: 'Market Opportunity',
  competitive_positioning: 'Competitive Positioning',
  trend_alignment: 'Trend Alignment',
  competitive_landscape: 'Competitive Landscape',
  market_gaps: 'Market Gaps',
};

// ============================================================================
// Zod Schema
// ============================================================================

/**
 * Zod schema for structured AI output
 *
 * Executive summary in 2-3 sentences for distributor pitch.
 */
const summarySchema = z.object({
  summary: z
    .string()
    .min(50)
    .max(300)
    .describe('Executive summary in 2-3 sentences for distributor pitch (max 300 chars)'),
  key_points: z
    .array(z.string())
    .max(3)
    .optional()
    .describe('Optional: Up to 3 key points extracted from pitch'),
});

// ============================================================================
// Prompt Builder
// ============================================================================

/**
 * Build the prompt for executive summary generation
 */
function buildSummaryPrompt(
  pitchTitle: string,
  sections: Array<{ type: PitchSectionType; content: string }>
): string {
  const sectionContext = sections
    .map(
      (s) =>
        `### ${SECTION_LABELS[s.type]}
${s.content}`
    )
    .join('\n\n');

  return `You are creating an executive summary for a pitch deck targeting Philippine snack distributors.

## Pitch Title
${pitchTitle}

## Pitch Content
${sectionContext}

## Instructions
Generate a compelling executive summary that:
1. Opens with the core market opportunity
2. Highlights the key differentiation or competitive advantage
3. Closes with a sense of urgency or timing opportunity

Requirements:
- Exactly 2-3 sentences
- Maximum 300 characters
- Professional, persuasive tone suitable for C-level distributor executives
- Focus on business value, not technical details
- Do not use marketing buzzwords

Return the summary that would make a busy distributor executive want to read more.`;
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/ai/generate-pitch-summary
 *
 * Generates an AI-powered executive summary for a pitch draft.
 *
 * Request body: {
 *   pitch_draft_id: string
 * }
 *
 * Response: {
 *   success: true,
 *   summary: string,
 *   generated_at: string,
 *   metadata: { model: string, sections_analyzed: number }
 * }
 */
export async function POST(request: Request): Promise<Response> {
  // Validate API key is configured
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const errorResponse: GeneratePitchSummaryErrorResponse = {
      success: false,
      error: 'AI service not configured',
      code: 'UNKNOWN',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse and validate request body
  let body: GeneratePitchSummaryRequest;
  try {
    const text = await request.text();
    if (!text.trim()) {
      throw new Error('Empty request body');
    }
    body = JSON.parse(text) as GeneratePitchSummaryRequest;
  } catch {
    const errorResponse: GeneratePitchSummaryErrorResponse = {
      success: false,
      error: 'Invalid request format',
      code: 'VALIDATION_ERROR',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required fields
  if (!body.pitch_draft_id) {
    const errorResponse: GeneratePitchSummaryErrorResponse = {
      success: false,
      error: 'Missing required field: pitch_draft_id',
      code: 'VALIDATION_ERROR',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Defense-in-depth: Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorResponse: GeneratePitchSummaryErrorResponse = {
        success: false,
        error: 'Authentication required',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch pitch draft (RLS handles access control)
    const { data: pitchDraft, error: draftError } = await supabase
      .from('pitch_drafts')
      .select('id, title, status')
      .eq('id', body.pitch_draft_id)
      .single();

    if (draftError || !pitchDraft) {
      const errorResponse: GeneratePitchSummaryErrorResponse = {
        success: false,
        error: 'Pitch draft not found',
        code: 'VALIDATION_ERROR',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all sections for this pitch
    const { data: sections, error: sectionsError } = await supabase
      .from('pitch_sections')
      .select('section_type, content')
      .eq('pitch_draft_id', body.pitch_draft_id)
      .order('created_at', { ascending: true });

    if (sectionsError) {
      throw new Error('Failed to fetch pitch sections');
    }

    // Check if pitch has any content
    if (!sections || sections.length === 0) {
      const errorResponse: GeneratePitchSummaryErrorResponse = {
        success: false,
        error: 'Pitch has no content sections. Generate content first.',
        code: 'EMPTY_PITCH',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter to only AI-generated text sections (not dynamic data sections)
    const textSections = sections.filter(
      (s) =>
        s.section_type === 'market_opportunity' ||
        s.section_type === 'competitive_positioning' ||
        s.section_type === 'trend_alignment'
    );

    if (textSections.length === 0) {
      const errorResponse: GeneratePitchSummaryErrorResponse = {
        success: false,
        error: 'Add content to at least one text section before generating summary.',
        code: 'EMPTY_PITCH',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log generation request
    if (env.isDevelopment) {
      console.log(
        `[Pitch Summary] Draft: ${body.pitch_draft_id}, Sections: ${textSections.length}`
      );
    }

    // Build the generation prompt
    const prompt = buildSummaryPrompt(
      pitchDraft.title,
      textSections.map((s) => ({
        type: s.section_type as PitchSectionType,
        content: s.content,
      }))
    );

    // Create Anthropic client
    const anthropic = createAnthropic({ apiKey });

    // Call Claude for structured summary generation
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: summarySchema,
      prompt,
      maxRetries: MAX_RETRIES,
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      temperature: 0.4, // Slightly creative but still focused
    });

    // Log for transparency
    if (env.isDevelopment) {
      console.log(`[Pitch Summary] Generated: ${result.object.summary.substring(0, 50)}...`);
    }

    // Build response
    const response: GeneratePitchSummaryResponse = {
      success: true,
      summary: result.object.summary,
      generated_at: new Date().toISOString(),
      metadata: {
        model: 'claude-sonnet-4-20250514',
        sections_analyzed: textSections.length,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Pitch summary generation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        const errorResponse: GeneratePitchSummaryErrorResponse = {
          success: false,
          error: 'Summary generation timed out. Try again.',
          code: 'TIMEOUT',
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        const errorResponse: GeneratePitchSummaryErrorResponse = {
          success: false,
          error: 'Service busy. Please try in a moment.',
          code: 'RATE_LIMIT',
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Generic error
    const errorResponse: GeneratePitchSummaryErrorResponse = {
      success: false,
      error: 'Failed to generate summary. Please try again.',
      code: 'UNKNOWN',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
