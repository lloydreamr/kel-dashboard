/**
 * Embeddings Repository
 *
 * All database operations for document embeddings (RAG infrastructure).
 * Uses browser client for search operations by default.
 * For server-side operations (API routes), pass a server client via options.
 * Service role client should be used for bulk operations (see scripts/).
 *
 * RLS ensures only authenticated users can access embedding data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError } from './base';

import type { Database } from '@/types/database';

/**
 * Options for repository operations
 * Pass a custom Supabase client for server-side operations
 */
export interface EmbeddingsRepoOptions {
  /** Custom Supabase client (use server client in API routes) */
  client?: SupabaseClient<Database>;
}

/**
 * Valid document types for embeddings
 * Matches the check constraint in the database
 */
export type DocumentType =
  | 'companies'
  | 'products'
  | 'consumers'
  | 'trends'
  | 'research_docs';

/**
 * A single embedding chunk to insert/update
 */
export interface EmbeddingChunk {
  document_type: DocumentType;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  token_count: number;
  embedding: number[];
}

/**
 * A search result from similarity search
 */
export interface SearchResult {
  id: string;
  document_type: DocumentType;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  similarity: number;
}

/**
 * Maximum chunks per batch to avoid payload limits
 * Supabase has a ~2MB payload limit; embeddings are large
 */
const BATCH_SIZE = 50;

/**
 * Convert number array to pgvector string format
 * pgvector expects: '[0.1,0.2,0.3,...]'
 */
function toVectorString(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Embeddings repository - handles vector storage and similarity search
 */
export const embeddingsRepo = {
  /**
   * Upsert embedding chunks for a document
   * Processes in batches to avoid payload limits
   *
   * @param chunks - Array of embedding chunks to insert/update
   * @throws RepositoryError on database errors
   */
  upsert: async (chunks: EmbeddingChunk[]): Promise<void> => {
    if (chunks.length === 0) return;

    const supabase = createClient();

    // Process in batches to avoid payload limits
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      // Convert number[] embeddings to pgvector string format
      const dbBatch = batch.map((chunk) => ({
        ...chunk,
        embedding: toVectorString(chunk.embedding),
      }));
      const { error } = await supabase
        .from('document_embeddings')
        .upsert(dbBatch, { onConflict: 'document_type,document_id,chunk_index' });

      if (error) {
        throw mapPostgrestError(error);
      }
    }
  },

  /**
   * Search for similar content using vector similarity
   *
   * @param queryEmbedding - The query vector (1536 dimensions)
   * @param matchThreshold - Minimum similarity score (0-1, default 0.7)
   * @param matchCount - Maximum results to return (default 10)
   * @param filterType - Optional filter by document type
   * @param options - Optional configuration including custom Supabase client
   * @returns Array of search results ordered by similarity
   * @throws RepositoryError on database errors
   */
  search: async (
    queryEmbedding: number[],
    matchThreshold = 0.7,
    matchCount = 10,
    filterType?: DocumentType,
    options?: EmbeddingsRepoOptions
  ): Promise<SearchResult[]> => {
    // Use provided client or fall back to browser client
    const supabase = options?.client ?? createClient();
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: toVectorString(queryEmbedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_type: filterType,
    });

    if (error) {
      throw mapPostgrestError(error);
    }

    return (data ?? []) as SearchResult[];
  },

  /**
   * Delete all embeddings for a specific document
   *
   * @param documentType - The type of document
   * @param documentId - The document UUID
   * @throws RepositoryError on database errors
   */
  deleteByDocument: async (
    documentType: DocumentType,
    documentId: string
  ): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('document_embeddings')
      .delete()
      .eq('document_type', documentType)
      .eq('document_id', documentId);

    if (error) {
      throw mapPostgrestError(error);
    }
  },

  /**
   * Delete orphan chunks for a document
   * Removes chunks with index >= threshold (used after re-embedding with fewer chunks)
   *
   * @param documentType - The type of document
   * @param documentId - The document UUID
   * @param fromIndex - Delete chunks with chunk_index >= this value
   * @throws RepositoryError on database errors
   */
  deleteOrphanChunks: async (
    documentType: DocumentType,
    documentId: string,
    fromIndex: number
  ): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('document_embeddings')
      .delete()
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .gte('chunk_index', fromIndex);

    if (error) {
      throw mapPostgrestError(error);
    }
  },

  /**
   * Get embedding count by document type
   * Useful for analytics and debugging
   *
   * @param documentType - Optional filter by type
   * @returns Count of embeddings
   */
  getCount: async (documentType?: DocumentType): Promise<number> => {
    const supabase = createClient();
    let query = supabase
      .from('document_embeddings')
      .select('*', { count: 'exact', head: true });

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { count, error } = await query;

    if (error) {
      throw mapPostgrestError(error);
    }

    return count ?? 0;
  },
};
