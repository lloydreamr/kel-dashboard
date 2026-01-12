/**
 * AI Chat Types
 *
 * Type definitions for the AI chat API endpoint.
 * Used for request/response validation and source citation formatting.
 */

import type { DocumentType } from '@/lib/repositories/embeddings';

/**
 * Confidence level for AI responses based on source quality
 * - High: Strong source matches (top similarity >= 0.85, avg >= 0.75)
 * - Medium: Moderate source matches (top similarity >= 0.75, avg >= 0.65)
 * - Low: Weak or no source matches
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Request body for chat API endpoint
 */
export interface ChatRequest {
  /** The user's question to answer */
  question: string;
}

/**
 * A source citation from the knowledge base
 * Maps to a document chunk that was used to answer the question
 */
export interface ChatSource {
  /** The type of document (companies, products, etc.) */
  documentType: DocumentType;
  /** UUID of the source document */
  documentId: string;
  /** Display title for the source */
  title: string;
  /** The relevant text excerpt from this source */
  excerpt: string;
  /** Similarity score (0-1) indicating relevance */
  similarity: number;
}

/**
 * Metadata included in the streamed response
 * Sent via writer.write() before/during text streaming
 */
export interface ChatResponseMetadata {
  /** Array of sources used to generate the response */
  sources: ChatSource[];
  /** Confidence level based on source quality */
  confidence: ConfidenceLevel;
}
