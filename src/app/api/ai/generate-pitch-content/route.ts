/**
 * AI Pitch Content Generation API Route
 *
 * POST /api/ai/generate-pitch-content
 *
 * Generates AI-powered content for pitch sections:
 * 1. Validates request and authenticates user
 * 2. Aggregates knowledge base context with section-specific weighting
 * 3. Calls Claude with structured output schema
 * 4. Saves/updates section and sources in database
 * 5. Returns generated content with metadata
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

import { aggregatePitchContext, hasKnowledgeBaseEntities, resolveSourceNames } from '@/lib/ai/pitch-context';
import { buildPitchPrompt, NO_CONTEXT_PITCH_PROMPT } from '@/lib/ai/pitch-prompts';
import { env } from '@/lib/env';
import {
  getSectionContextWeights,
  getSectionPromptModifier,
  getTemplateTone,
} from '@/lib/pitch/templates';
import { createClient } from '@/lib/supabase/server';

import type {
  GeneratePitchContentRequest,
  GeneratePitchContentResponse,
  GeneratePitchContentErrorResponse,
  AIGeneratedPitchContent,
  TemplatePromptContext,
} from '@/lib/ai/pitch-types';
import type { PitchSectionType, PitchSourceType, PitchTemplateType } from '@/types/pitch';

/**
 * Maximum retries for Anthropic API calls (handles rate limits)
 */
const MAX_RETRIES = 3;

/**
 * Request timeout in milliseconds (45 seconds for focused generation)
 */
const REQUEST_TIMEOUT_MS = 45000;

/**
 * Valid section types for validation
 */
const VALID_SECTION_TYPES: PitchSectionType[] = [
  'market_opportunity',
  'competitive_positioning',
  'trend_alignment',
];

/**
 * Zod schema for structured AI output
 *
 * Matches AIGeneratedPitchContent for section content generation.
 */
const pitchContentSchema = z.object({
  content: z.string()
    .min(100)
    .max(2000)
    .describe('Generated pitch content in markdown format (200-400 words)'),
  confidence_score: z.number()
    .min(0)
    .max(1)
    .describe('Confidence score based on evidence quality (0.0-1.0)'),
  sources: z.array(z.object({
    entity_type: z.enum(['company', 'product', 'consumer', 'trend', 'research'])
      .describe('Type of MI entity referenced'),
    entity_id: z.string()
      .uuid()
      .describe('UUID of the source entity'),
    relevance_score: z.number()
      .min(0)
      .max(1)
      .describe('How relevant this source is to the content'),
    key_insight: z.string()
      .max(200)
      .describe('Key data point used from this source'),
  })).min(1).max(10)
    .describe('Sources referenced in the content (1-10 sources)'),
  reasoning: z.string()
    .max(500)
    .describe('Brief explanation of generation approach (not persisted)'),
});

/**
 * Map AI entity type to database source type
 */
function mapEntityToSourceType(
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

/**
 * POST /api/ai/generate-pitch-content
 *
 * Generates AI-powered content for a pitch section.
 *
 * Request body: {
 *   pitch_draft_id: string,
 *   section_type: 'market_opportunity' | 'competitive_positioning' | 'trend_alignment',
 *   context?: { company_ids?: string[], product_ids?: string[], ... }
 * }
 *
 * Response: {
 *   success: true,
 *   section: { id, content, confidence_score, ... },
 *   sources: [{ id, source_type, source_id, source_name, ... }],
 *   metadata: { model, tokens_used, generated_at }
 * }
 */
export async function POST(request: Request): Promise<Response> {
  // Validate API key is configured
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const errorResponse: GeneratePitchContentErrorResponse = {
      success: false,
      error: 'AI service not configured',
      code: 'UNKNOWN',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse and validate request body
  let body: GeneratePitchContentRequest;
  try {
    const text = await request.text();
    if (!text.trim()) {
      throw new Error('Empty request body');
    }
    body = JSON.parse(text) as GeneratePitchContentRequest;
  } catch {
    const errorResponse: GeneratePitchContentErrorResponse = {
      success: false,
      error: 'Invalid request format',
      code: 'VALIDATION_ERROR',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  if (!body.pitch_draft_id || !body.section_type) {
    const errorResponse: GeneratePitchContentErrorResponse = {
      success: false,
      error: 'Missing required fields: pitch_draft_id, section_type',
      code: 'VALIDATION_ERROR',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate section type
  if (!VALID_SECTION_TYPES.includes(body.section_type)) {
    const errorResponse: GeneratePitchContentErrorResponse = {
      success: false,
      error: `Invalid section_type. Must be one of: ${VALID_SECTION_TYPES.join(', ')}`,
      code: 'VALIDATION_ERROR',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Defense-in-depth: Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorResponse: GeneratePitchContentErrorResponse = {
        success: false,
        error: 'Authentication required',
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify pitch draft exists and user has access (RLS handles this)
    // Story 18-4: Fetch template_type to apply template-specific generation
    const { data: pitchDraft, error: draftError } = await supabase
      .from('pitch_drafts')
      .select('id, status, template_type')
      .eq('id', body.pitch_draft_id)
      .single();

    if (draftError || !pitchDraft) {
      const errorResponse: GeneratePitchContentErrorResponse = {
        success: false,
        error: 'Pitch draft not found',
        code: 'VALIDATION_ERROR',
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Story 18-4: Get template type for context weighting and prompt modification
    const templateType = pitchDraft.template_type as PitchTemplateType;

    // Check if knowledge base has entities
    const hasEntities = await hasKnowledgeBaseEntities(supabase);
    if (!hasEntities) {
      const errorResponse: GeneratePitchContentErrorResponse = {
        success: false,
        error: 'No market intelligence data available. Add data to the knowledge base first.',
        code: 'EMPTY_KNOWLEDGE_BASE',
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log generation request
    if (env.isDevelopment) {
      console.log(`[Pitch Generation] Section: ${body.section_type}, Draft: ${body.pitch_draft_id}`);
    }

    // Story 18-4: Get template-specific context weights
    const templateWeights = getSectionContextWeights(templateType, body.section_type);

    // Aggregate context with section-specific weighting (template-aware)
    const context = await aggregatePitchContext(
      supabase,
      body.section_type,
      body.context,
      templateWeights
    );

    // Story 18-4: Build template context for prompt modification
    const templatePromptContext: TemplatePromptContext = {
      promptModifier: getSectionPromptModifier(templateType, body.section_type),
      tone: getTemplateTone(templateType),
    };

    // Build the generation prompt (template-aware)
    const prompt = context.formattedContext
      ? buildPitchPrompt(body.section_type, context, templatePromptContext)
      : NO_CONTEXT_PITCH_PROMPT;

    // Create Anthropic client
    const anthropic = createAnthropic({ apiKey });

    // Call Claude for structured content generation
    let generatedContent: AIGeneratedPitchContent;
    let retryCount = 0;
    const MAX_SCHEMA_RETRIES = 1;

    while (true) {
      try {
        const result = await generateObject({
          model: anthropic('claude-sonnet-4-20250514'),
          schema: pitchContentSchema,
          prompt,
          maxRetries: MAX_RETRIES,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          temperature: 0.3, // Slightly higher than opportunity for more creative content
        });
        generatedContent = result.object;
        break;
      } catch (schemaError) {
        const isValidationError = schemaError instanceof Error &&
          (schemaError.message.includes('ZodError') ||
           schemaError.message.includes('validation') ||
           schemaError.message.includes('schema'));

        if (isValidationError && retryCount < MAX_SCHEMA_RETRIES) {
          retryCount++;
          console.warn(`[Pitch Generation] Malformed response, retry ${retryCount}/${MAX_SCHEMA_RETRIES}`);
          continue;
        }
        throw schemaError;
      }
    }

    // Log reasoning for transparency
    if (env.isDevelopment) {
      console.log(`[Pitch Generation] Reasoning: ${generatedContent.reasoning}`);
    }

    // Check if section already exists (for upsert)
    const { data: existingSection } = await supabase
      .from('pitch_sections')
      .select('id')
      .eq('pitch_draft_id', body.pitch_draft_id)
      .eq('section_type', body.section_type)
      .maybeSingle();

    let sectionId: string;

    if (existingSection) {
      // Update existing section
      const { data: updatedSection, error: updateError } = await supabase
        .from('pitch_sections')
        .update({
          content: generatedContent.content,
          confidence_score: generatedContent.confidence_score,
          ai_generated: true,
          user_edited: false, // Reset since this is regeneration
        })
        .eq('id', existingSection.id)
        .select()
        .single();

      if (updateError || !updatedSection) {
        throw new Error('Failed to update section');
      }

      sectionId = updatedSection.id;

      // Delete old sources
      await supabase
        .from('pitch_section_sources')
        .delete()
        .eq('section_id', sectionId);
    } else {
      // Create new section
      const { data: newSection, error: createError } = await supabase
        .from('pitch_sections')
        .insert({
          pitch_draft_id: body.pitch_draft_id,
          section_type: body.section_type,
          content: generatedContent.content,
          confidence_score: generatedContent.confidence_score,
          ai_generated: true,
          user_edited: false,
        })
        .select()
        .single();

      if (createError || !newSection) {
        throw new Error('Failed to create section');
      }

      sectionId = newSection.id;
    }

    // Create source records
    const sourceInserts = generatedContent.sources.map(source => ({
      section_id: sectionId,
      source_type: mapEntityToSourceType(source.entity_type),
      source_id: source.entity_id,
      relevance_score: source.relevance_score,
    }));

    const { data: createdSources, error: sourcesError } = await supabase
      .from('pitch_section_sources')
      .insert(sourceInserts)
      .select();

    if (sourcesError) {
      console.error('Failed to create sources:', sourcesError);
      // Continue - sources are not critical
    }

    // Resolve source names for response
    const sourceNames = await resolveSourceNames(supabase, generatedContent.sources);

    // Fetch the final section state
    const { data: finalSection } = await supabase
      .from('pitch_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    // Build response
    const response: GeneratePitchContentResponse = {
      success: true,
      section: {
        id: finalSection?.id ?? sectionId,
        pitch_draft_id: body.pitch_draft_id,
        section_type: body.section_type,
        content: generatedContent.content,
        ai_generated: true,
        user_edited: false,
        confidence_score: generatedContent.confidence_score,
        created_at: finalSection?.created_at ?? new Date().toISOString(),
        updated_at: finalSection?.updated_at ?? new Date().toISOString(),
      },
      sources: (createdSources ?? []).map((source, index) => ({
        id: source.id,
        source_type: source.source_type as PitchSourceType,
        source_id: source.source_id,
        relevance_score: source.relevance_score,
        source_name: sourceNames.get(source.source_id) ?? 'Unknown',
      })),
      metadata: {
        model: 'claude-sonnet-4-20250514',
        tokens_used: context.estimatedTokens,
        generated_at: new Date().toISOString(),
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pitch generation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        const errorResponse: GeneratePitchContentErrorResponse = {
          success: false,
          error: 'Generation timed out. Please try again.',
          code: 'TIMEOUT',
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        const errorResponse: GeneratePitchContentErrorResponse = {
          success: false,
          error: 'Service is busy. Please try again in a moment.',
          code: 'RATE_LIMIT',
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generic error
    const errorResponse: GeneratePitchContentErrorResponse = {
      success: false,
      error: 'Failed to generate content. Please try again.',
      code: 'UNKNOWN',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
