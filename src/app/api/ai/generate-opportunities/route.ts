/**
 * AI Opportunity Generation API Route
 *
 * POST /api/ai/generate-opportunities
 *
 * Analyzes knowledge base and generates market opportunities:
 * 1. Aggregates all entities from knowledge base
 * 2. Sends context to Claude for structured analysis
 * 3. Extracts opportunities in 4 categories
 * 4. Saves to database with supporting evidence links
 *
 * Story 16-2: AI Opportunity Generation Job
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

import { aggregateKnowledgeBaseContext, hasKnowledgeBaseEntities } from '@/lib/ai/opportunity-context';
import { buildOpportunityPrompt, NO_CONTEXT_OPPORTUNITY_PROMPT } from '@/lib/ai/opportunity-prompts';
import { env } from '@/lib/env';
import { opportunitiesRepo } from '@/lib/repositories/opportunities';
import { createClient } from '@/lib/supabase/server';

import type {
  GenerateOpportunitiesRequest,
  GenerateOpportunitiesResponse,
  GenerateOpportunitiesErrorResponse,
  GeneratedOpportunity,
} from '@/lib/ai/opportunity-types';
import type { OpportunityCategory, OpportunityInput } from '@/lib/repositories/opportunities';

/**
 * Maximum retries for Anthropic API calls (handles rate limits)
 * AI SDK uses exponential backoff automatically
 */
const MAX_RETRIES = 3;

/**
 * Request timeout in milliseconds (60 seconds for full analysis)
 */
const REQUEST_TIMEOUT_MS = 60000;

/**
 * Zod schema for structured AI output
 *
 * Defines the exact shape Claude should return.
 * Matches GeneratedOpportunity[] with analysis summary.
 */
const opportunityAnalysisSchema = z.object({
  opportunities: z.array(z.object({
    title: z.string().describe('Concise, actionable opportunity name'),
    description: z.string().describe('2-3 sentence explanation of the opportunity'),
    category: z.enum(['market_gap', 'product_opportunity', 'competitive_weakness', 'trend_alignment'])
      .describe('Category of opportunity'),
    confidence_score: z.number().min(0).max(1)
      .describe('Confidence based on evidence strength (0.0-1.0)'),
    supporting_evidence: z.array(z.object({
      entity_type: z.enum(['company', 'product', 'consumer', 'trend', 'research'])
        .describe('Type of knowledge base entity'),
      entity_id: z.string().uuid().describe('UUID of the supporting entity'),
      relevance_score: z.number().min(0).max(1).describe('How relevant this evidence is'),
      excerpt: z.string().describe('Key quote or data point from the entity'),
    })).describe('Links to knowledge base entities that support this opportunity'),
    reasoning: z.string().describe('Why this is an opportunity for Kel (for transparency)'),
  })),
  analysis_summary: z.object({
    total_entities_analyzed: z.number().describe('Total knowledge base entities analyzed'),
    opportunities_by_category: z.record(z.string(), z.number()).describe('Count of opportunities by category'),
  }),
});

/**
 * Convert AI-generated opportunity to database input format
 *
 * Strips the reasoning field (not persisted) and maps to OpportunityInput.
 */
function toOpportunityInput(opportunity: GeneratedOpportunity): OpportunityInput {
  return {
    title: opportunity.title,
    description: opportunity.description,
    category: opportunity.category,
    confidence_score: opportunity.confidence_score,
    supporting_evidence: opportunity.supporting_evidence,
    generated_at: new Date(),
  };
}

/**
 * POST /api/ai/generate-opportunities
 *
 * Analyzes knowledge base and generates market opportunities.
 *
 * Request body: { regenerate?: boolean }
 * - regenerate: if true, deletes existing opportunities before generating new ones
 *
 * Response: { success: true, generated: number, breakdown: Record<category, count> }
 */
export async function POST(request: Request): Promise<Response> {
  // Validate API key is configured
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const errorResponse: GenerateOpportunitiesErrorResponse = {
      success: false,
      error: 'Anthropic API key not configured',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse request body (optional - empty body is valid)
  let body: GenerateOpportunitiesRequest = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as GenerateOpportunitiesRequest;
    }
  } catch {
    const errorResponse: GenerateOpportunitiesErrorResponse = {
      success: false,
      error: 'Invalid JSON in request body',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Defense-in-depth: Verify authentication (middleware handles primary auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorResponse: GenerateOpportunitiesErrorResponse = {
        success: false,
        error: 'Authentication required',
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log generation request for audit trail
    if (env.isDevelopment) {
      console.log(`[Opportunity Generation] Triggered by user: ${user.id}`);
    }

    // Check if regenerate flag is set - delete existing opportunities
    if (body.regenerate) {
      await opportunitiesRepo.deleteAll({ client: supabase });
    }

    // Check if knowledge base has any entities
    const hasEntities = await hasKnowledgeBaseEntities(supabase);

    if (!hasEntities) {
      // Empty knowledge base - return success with 0 opportunities
      const successResponse: GenerateOpportunitiesResponse = {
        success: true,
        generated: 0,
        breakdown: {
          market_gap: 0,
          product_opportunity: 0,
          competitive_weakness: 0,
          trend_alignment: 0,
        },
      };
      return new Response(
        JSON.stringify(successResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate knowledge base context
    const context = await aggregateKnowledgeBaseContext(supabase);

    // Build the analysis prompt
    const prompt = context.formattedContext
      ? buildOpportunityPrompt(context)
      : NO_CONTEXT_OPPORTUNITY_PROMPT;

    // Create Anthropic client
    const anthropic = createAnthropic({ apiKey });

    // Call Claude for structured analysis with retry for malformed responses
    let analysisResult: z.infer<typeof opportunityAnalysisSchema>;
    let retryCount = 0;
    const MAX_SCHEMA_RETRIES = 1; // Retry once for malformed response

    while (true) {
      try {
        const result = await generateObject({
          model: anthropic('claude-sonnet-4-20250514'),
          schema: opportunityAnalysisSchema,
          prompt,
          maxRetries: MAX_RETRIES,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          temperature: 0.2, // Lower for consistent structured output
        });
        analysisResult = result.object;
        break; // Success, exit retry loop
      } catch (schemaError) {
        const isValidationError = schemaError instanceof Error &&
          (schemaError.message.includes('ZodError') ||
           schemaError.message.includes('validation') ||
           schemaError.message.includes('schema'));

        if (isValidationError && retryCount < MAX_SCHEMA_RETRIES) {
          retryCount++;
          console.warn(`[Opportunity Generation] Malformed response, retry ${retryCount}/${MAX_SCHEMA_RETRIES}`);
          continue; // Retry
        }
        throw schemaError; // Re-throw if not validation error or retries exhausted
      }
    }

    // Log reasoning for transparency (not persisted)
    if (env.isDevelopment) {
      for (const opp of analysisResult.opportunities) {
        console.log(`[Opportunity] ${opp.title}: ${opp.reasoning}`);
      }
    }

    // Convert to database input format
    const inputs: OpportunityInput[] = analysisResult.opportunities.map(toOpportunityInput);

    // Save to database
    if (inputs.length > 0) {
      await opportunitiesRepo.createBatch(inputs, { client: supabase });
    }

    // Calculate breakdown by category
    const breakdown: Record<OpportunityCategory, number> = {
      market_gap: 0,
      product_opportunity: 0,
      competitive_weakness: 0,
      trend_alignment: 0,
    };

    for (const opp of analysisResult.opportunities) {
      breakdown[opp.category]++;
    }

    // Return success response
    const successResponse: GenerateOpportunitiesResponse = {
      success: true,
      generated: inputs.length,
      breakdown,
    };

    return new Response(
      JSON.stringify(successResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Opportunity generation error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      // Timeout errors (AbortSignal.timeout)
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        const errorResponse: GenerateOpportunitiesErrorResponse = {
          success: false,
          error: 'Analysis timed out. Please try again.',
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit errors (after retries exhausted)
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        const errorResponse: GenerateOpportunitiesErrorResponse = {
          success: false,
          error: 'Service is busy. Please try again in a moment.',
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Anthropic API errors
      if (error.message.includes('Anthropic') || error.message.includes('Claude')) {
        const errorResponse: GenerateOpportunitiesErrorResponse = {
          success: false,
          error: 'Failed to generate AI analysis. Please try again.',
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Zod validation errors (malformed AI response)
      if (error.message.includes('ZodError') || error.message.includes('validation')) {
        const errorResponse: GenerateOpportunitiesErrorResponse = {
          success: false,
          error: 'Failed to parse AI response. Please try again.',
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generic error (masked for security)
    const errorResponse: GenerateOpportunitiesErrorResponse = {
      success: false,
      error: 'Failed to generate opportunities. Please try again.',
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
