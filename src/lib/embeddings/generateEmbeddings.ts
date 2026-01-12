/**
 * Embedding Generation Job
 *
 * Orchestrates the process of extracting content from entities,
 * chunking it, generating embeddings, and storing them.
 *
 * ⚠️ SERVER-SIDE ONLY - Uses OpenAI API and should only run in
 * server context (API routes or CLI scripts).
 */

import { chunkMarkdown } from './chunker';
import { generateEmbeddings } from './openai';
import {
  embeddingsRepo,
  type DocumentType,
  type EmbeddingChunk,
} from '@/lib/repositories/embeddings';
import {
  extractCompanyContent,
  extractProductContent,
  extractConsumerContent,
  extractTrendContent,
  extractResearchDocContent,
} from './contentExtractor';
import type { Database } from '@/types/database';

// Entity types
type Company = Database['public']['Tables']['companies']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Consumer = Database['public']['Tables']['consumers']['Row'];
type Trend = Database['public']['Tables']['trends']['Row'];
type ResearchDoc = Database['public']['Tables']['research_docs']['Row'];

/**
 * Result of embedding a single document
 */
export interface EmbedDocumentResult {
  documentType: DocumentType;
  documentId: string;
  chunksCreated: number;
  success: boolean;
  error?: string;
}

/**
 * Result of batch embedding operation
 */
export interface EmbedAllResult {
  total: number;
  succeeded: number;
  failed: number;
  results: EmbedDocumentResult[];
}

/**
 * Progress callback for tracking embedding generation
 */
export type ProgressCallback = (
  current: number,
  total: number,
  item: { type: DocumentType; id: string }
) => void;

/**
 * Embed a single document
 *
 * Extracts content, chunks it, generates embeddings, and stores them.
 * Deletes existing embeddings first to avoid stale data.
 *
 * @param documentType - The type of document
 * @param documentId - The document UUID
 * @param content - Pre-extracted content to embed
 * @returns Result with chunk count and success status
 */
export async function embedDocument(
  documentType: DocumentType,
  documentId: string,
  content: string
): Promise<EmbedDocumentResult> {
  try {
    // Skip empty content
    if (!content || !content.trim()) {
      return {
        documentType,
        documentId,
        chunksCreated: 0,
        success: true,
      };
    }

    // Chunk the content
    const textChunks = chunkMarkdown(content);

    if (textChunks.length === 0) {
      return {
        documentType,
        documentId,
        chunksCreated: 0,
        success: true,
      };
    }

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(textChunks.map(c => c.text));

    // Build embedding chunks for storage
    // Use array index i (not chunk.index) to ensure embeddings align with chunks
    // chunk.index from chunker may not be sequential if chunks were filtered
    const chunks: EmbeddingChunk[] = textChunks.map((chunk, i) => ({
      document_type: documentType,
      document_id: documentId,
      chunk_index: i,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      embedding: embeddings[i],
    }));

    // Store new embeddings first (upsert replaces existing chunks via onConflict)
    // This is safer than delete-first: if upsert fails, old embeddings remain intact
    await embeddingsRepo.upsert(chunks);

    // Delete orphan chunks from previous embedding (if doc had more chunks before)
    // This runs after successful upsert to clean up stale data
    await embeddingsRepo.deleteOrphanChunks(documentType, documentId, chunks.length);

    return {
      documentType,
      documentId,
      chunksCreated: chunks.length,
      success: true,
    };
  } catch (error) {
    return {
      documentType,
      documentId,
      chunksCreated: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Embed a company entity
 */
export async function embedCompany(
  company: Company
): Promise<EmbedDocumentResult> {
  const content = extractCompanyContent(company);
  return embedDocument('companies', company.id, content);
}

/**
 * Embed a product entity
 */
export async function embedProduct(
  product: Product
): Promise<EmbedDocumentResult> {
  const content = extractProductContent(product);
  return embedDocument('products', product.id, content);
}

/**
 * Embed a consumer segment entity
 */
export async function embedConsumer(
  consumer: Consumer
): Promise<EmbedDocumentResult> {
  const content = extractConsumerContent(consumer);
  return embedDocument('consumers', consumer.id, content);
}

/**
 * Embed a trend entity
 */
export async function embedTrend(trend: Trend): Promise<EmbedDocumentResult> {
  const content = extractTrendContent(trend);
  return embedDocument('trends', trend.id, content);
}

/**
 * Embed a research document
 */
export async function embedResearchDoc(
  doc: ResearchDoc
): Promise<EmbedDocumentResult> {
  const content = extractResearchDocContent(doc);
  return embedDocument('research_docs', doc.id, content);
}

/**
 * Document item for batch processing
 */
export interface DocumentItem {
  type: DocumentType;
  id: string;
  content: string;
}

/**
 * Embed all documents in a batch
 *
 * Processes documents sequentially to respect rate limits.
 * Continues on failure to maximize progress.
 *
 * @param documents - Array of documents to embed
 * @param onProgress - Optional callback for progress tracking
 * @returns Aggregate result with success/failure counts
 */
export async function embedAllDocuments(
  documents: DocumentItem[],
  onProgress?: ProgressCallback
): Promise<EmbedAllResult> {
  const results: EmbedDocumentResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    // Report progress
    if (onProgress) {
      onProgress(i + 1, documents.length, { type: doc.type, id: doc.id });
    }

    const result = await embedDocument(doc.type, doc.id, doc.content);
    results.push(result);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return {
    total: documents.length,
    succeeded,
    failed,
    results,
  };
}
