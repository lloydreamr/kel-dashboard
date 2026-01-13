/**
 * AI Chat API Route
 *
 * POST /api/ai/chat
 *
 * RAG-powered chat endpoint that:
 * 1. Accepts a question from the user
 * 2. Generates query embedding and searches knowledge base
 * 3. Builds context from relevant document chunks
 * 4. Streams Claude's response with source citations
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { createUIMessageStream, createUIMessageStreamResponse, streamText } from 'ai';

import { buildSystemPrompt, NO_CONTEXT_PROMPT } from '@/lib/ai/prompts';
import {
  buildContextFromSources,
  calculateConfidence,
  extractSourcesFromResults,
} from '@/lib/ai/rag-context';
import { generateQueryEmbedding } from '@/lib/embeddings/openai';
import { env } from '@/lib/env';
import { embeddingsRepo } from '@/lib/repositories/embeddings';
import { createClient } from '@/lib/supabase/server';

import type { ChatRequest, ChatResponseMetadata } from '@/lib/ai/types';

/**
 * Number of similar chunks to retrieve from knowledge base
 */
const MATCH_COUNT = 10;

/**
 * Minimum similarity threshold for including results (0-1)
 */
const MATCH_THRESHOLD = 0.7;

/**
 * Maximum retries for Anthropic API calls (handles rate limits)
 * AI SDK uses exponential backoff automatically
 */
const MAX_RETRIES = 3;

/**
 * Request timeout in milliseconds (30 seconds)
 */
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Sanitize user input to prevent prompt injection
 *
 * Removes:
 * - Control characters (except newlines/tabs)
 * - Excessive whitespace
 * - Common prompt injection patterns
 *
 * @param input - Raw user input
 * @returns Sanitized input safe for LLM
 */
function sanitizeQuestion(input: string): string {
  return input
    // Remove control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse multiple newlines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces to single space
    .replace(/ {2,}/g, ' ')
    // Remove common prompt injection patterns (instructions to ignore/override)
    .replace(/ignore (all )?(previous|above|prior) (instructions?|prompts?|context)/gi, '')
    .replace(/disregard (all )?(previous|above|prior)/gi, '')
    .replace(/you are now/gi, '')
    .replace(/new instructions?:/gi, '')
    .replace(/system prompt:/gi, '')
    .trim();
}

/**
 * POST /api/ai/chat
 *
 * Accepts a question and returns a streaming AI response with source citations.
 *
 * Request body: { question: string }
 * Response: Streaming UI message with sources metadata
 */
export async function POST(request: Request): Promise<Response> {
  // Validate API key is configured
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Anthropic API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse and validate request body
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { question } = body;

  if (!question || typeof question !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Question is required and must be a string' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (question.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Question cannot be empty' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (question.length > 2000) {
    return new Response(
      JSON.stringify({ error: 'Question must be 2000 characters or less' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Step 0: Create server client and sanitize input
    const supabase = await createClient();
    const sanitizedQuestion = sanitizeQuestion(question);

    // Step 1: Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(sanitizedQuestion);

    // Step 2: Search for relevant document chunks
    const searchResults = await embeddingsRepo.search(
      queryEmbedding,
      MATCH_THRESHOLD,
      MATCH_COUNT,
      undefined,
      { client: supabase }
    );

    // Step 3: Extract sources and calculate confidence
    const sources = extractSourcesFromResults(searchResults);
    const confidence = calculateConfidence(searchResults);

    // Step 4: Build context and system prompt
    const context = buildContextFromSources(searchResults);
    const systemPrompt = searchResults.length > 0
      ? buildSystemPrompt(sources, context)
      : NO_CONTEXT_PROMPT;

    // Step 5: Prepare metadata for stream
    const metadata: ChatResponseMetadata = {
      sources,
      confidence,
    };

    // Step 6: Create Anthropic client
    const anthropic = createAnthropic({ apiKey });

    // Step 7: Create streaming response with metadata
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Send start marker
        writer.write({ type: 'start' });

        // Send sources metadata via custom data part
        writer.write({
          type: 'data-metadata',
          data: metadata,
        });

        // Stream the AI response with retry and timeout
        const result = streamText({
          model: anthropic('claude-sonnet-4-20250514'),
          system: systemPrompt,
          messages: [{ role: 'user', content: sanitizedQuestion }],
          maxOutputTokens: 1024,
          maxRetries: MAX_RETRIES, // Exponential backoff for rate limits
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), // Request timeout
        });

        // Merge the text stream with confidence metadata on finish
        writer.merge(result.toUIMessageStream({
          sendStart: false,
          messageMetadata: ({ part }) => {
            if (part.type === 'finish') {
              return { confidence };
            }
            return undefined;
          },
        }));
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('Chat API error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      // Timeout errors (AbortSignal.timeout)
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timed out. Please try again.' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit errors (after retries exhausted)
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return new Response(
          JSON.stringify({ error: 'Service is busy. Please try again in a moment.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // OpenAI embedding errors
      if (error.message.includes('OpenAI') || error.message.includes('embedding')) {
        return new Response(
          JSON.stringify({ error: 'Failed to process your question. Please try again.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Anthropic API errors
      if (error.message.includes('Anthropic') || error.message.includes('Claude')) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate AI response. Please try again.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generic error (masked for security)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
