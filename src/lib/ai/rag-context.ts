/**
 * RAG Context Builder
 *
 * Utilities for building LLM context from search results.
 * Handles context formatting, token truncation, and confidence calculation.
 */

import { encode } from 'gpt-tokenizer';

import type { SearchResult } from '@/lib/repositories/embeddings';

import type { ChatSource, ConfidenceLevel } from './types';

/**
 * Default maximum tokens for context
 * Leaves room for system prompt, question, and response
 */
const DEFAULT_MAX_TOKENS = 4000;

/**
 * Build formatted context string from search results
 *
 * Formats each result as a labeled section and truncates to stay within token limit.
 * Results are processed in order (highest similarity first).
 *
 * @param results - Search results ordered by similarity
 * @param maxTokens - Maximum tokens for context (default 4000)
 * @returns Formatted context string with source labels
 */
export function buildContextFromSources(
  results: SearchResult[],
  maxTokens = DEFAULT_MAX_TOKENS
): string {
  if (results.length === 0) {
    return '';
  }

  let context = '';
  let tokenCount = 0;

  for (const result of results) {
    // Format: [document_type/document_id]:\n{chunk_text}
    const section = `\n\n[${result.document_type}/${result.document_id}]:\n${result.chunk_text}`;
    const sectionTokens = encode(section).length;

    // Check if adding this section would exceed limit
    if (tokenCount + sectionTokens > maxTokens) {
      break;
    }

    context += section;
    tokenCount += sectionTokens;
  }

  return context.trim();
}

/**
 * Extract ChatSource array from search results
 *
 * Maps database SearchResult format to frontend-friendly ChatSource format.
 * Generates display titles based on document type and ID.
 *
 * @param results - Search results from embeddings repository
 * @returns Array of ChatSource objects for response metadata
 */
export function extractSourcesFromResults(results: SearchResult[]): ChatSource[] {
  return results.map((result) => ({
    documentType: result.document_type,
    documentId: result.document_id,
    title: generateSourceTitle(result.document_type, result.document_id),
    excerpt: truncateExcerpt(result.chunk_text, 150),
    similarity: result.similarity,
  }));
}

/**
 * Calculate confidence level based on search result quality
 *
 * Uses top similarity and average similarity to determine confidence:
 * - High: top >= 0.85 AND avg >= 0.75
 * - Medium: top >= 0.75 AND avg >= 0.65
 * - Low: everything else (including no results)
 *
 * @param results - Search results to evaluate
 * @returns Confidence level for the response
 */
export function calculateConfidence(results: SearchResult[]): ConfidenceLevel {
  if (results.length === 0) {
    return 'Low';
  }

  // Get top similarity (results are ordered by similarity desc)
  const topSimilarity = results[0]?.similarity ?? 0;

  // Calculate average similarity
  const avgSimilarity =
    results.reduce((sum, r) => sum + r.similarity, 0) / results.length;

  // Apply threshold logic
  if (topSimilarity >= 0.85 && avgSimilarity >= 0.75) {
    return 'High';
  }

  if (topSimilarity >= 0.75 && avgSimilarity >= 0.65) {
    return 'Medium';
  }

  return 'Low';
}

/**
 * Generate a display title for a source
 *
 * Creates a human-readable title based on document type.
 * Uses document ID as fallback (will be replaced with actual titles in future).
 *
 * @param documentType - Type of the document
 * @param documentId - UUID of the document
 * @returns Human-readable source title
 */
function generateSourceTitle(documentType: string, documentId: string): string {
  // Map document types to readable labels
  const typeLabels: Record<string, string> = {
    companies: 'Company',
    products: 'Product',
    consumers: 'Consumer Research',
    trends: 'Market Trend',
    research_docs: 'Research Document',
  };

  const label = typeLabels[documentType] ?? 'Document';

  // Use shortened ID for display (first 8 chars of UUID)
  const shortId = documentId.slice(0, 8);

  return `${label} (${shortId})`;
}

/**
 * Truncate excerpt to a maximum length
 *
 * Adds ellipsis if truncated, preserving word boundaries.
 *
 * @param text - Full text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text with ellipsis if needed
 */
function truncateExcerpt(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength to preserve word boundary
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}
