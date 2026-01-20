/**
 * AI System Prompts
 *
 * System prompt templates for the AI chat endpoint.
 * Instructs the LLM on how to use context and cite sources.
 */

import type { ChatSource } from './types';

/**
 * Base system prompt template for the market intelligence assistant
 *
 * Instructs Claude to:
 * - Use only provided context for answers
 * - Cite sources using [Source: type/id] format
 * - Admit uncertainty when context is insufficient
 * - Stay factual and market-intelligence focused
 */
const SYSTEM_PROMPT_TEMPLATE = `You are Kel's market intelligence assistant for the Philippine snack market.

Your role is to answer questions based ONLY on the provided context from our knowledge base.

RULES:
1. Always cite your sources using [Source: document_type/document_id] format
2. If the context doesn't contain enough information, say "Based on available data..." and note limitations
3. Stay factual - do not speculate beyond what's in the context
4. Focus on market intelligence: companies, products, consumers, trends
5. Be concise but thorough

AVAILABLE SOURCES:
{sources_list}

CONTEXT FROM KNOWLEDGE BASE:
{context}

Based on the above context, answer the user's question.`;

/**
 * Build the system prompt with context and source list
 *
 * Injects the context string and formatted source list into the template.
 *
 * @param sources - Array of ChatSource objects used for this response
 * @param context - Formatted context string from buildContextFromSources()
 * @returns Complete system prompt ready for LLM
 */
export function buildSystemPrompt(sources: ChatSource[], context: string): string {
  // Format sources list for the prompt
  const sourcesList = formatSourcesList(sources);

  // Replace placeholders in template
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{sources_list}', sourcesList)
    .replace('{context}', context);
}

/**
 * Format sources into a numbered list for the system prompt
 *
 * Creates a list like:
 * - [companies/abc123]: Company (abc12345)
 * - [products/def456]: Product (def45678)
 *
 * @param sources - Array of ChatSource objects
 * @returns Formatted source list string
 */
function formatSourcesList(sources: ChatSource[]): string {
  if (sources.length === 0) {
    return '(No relevant sources found in knowledge base)';
  }

  return sources
    .map((source) => `- [${source.documentType}/${source.documentId}]: ${source.title}`)
    .join('\n');
}

/**
 * System prompt for when no context is available
 *
 * Used when similarity search returns no results.
 * Instructs the LLM to be helpful but honest about limitations.
 */
export const NO_CONTEXT_PROMPT = `You are Kel's market intelligence assistant for the Philippine snack market.

The user asked a question, but I could not find any relevant information in our knowledge base.

Please:
1. Acknowledge that you don't have specific data on this topic
2. Explain what types of information ARE in our knowledge base (companies, products, consumer research, market trends)
3. Suggest how they might rephrase their question to find relevant data
4. DO NOT make up information or speculate

Be helpful and conversational, but honest about your limitations.`;
