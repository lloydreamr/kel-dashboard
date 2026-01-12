/**
 * Embeddings Repository Tests
 *
 * Tests for vector storage and similarity search operations.
 * Mocks Supabase client to test repository logic in isolation.
 *
 * @see Story 15-1: Document Embeddings Infrastructure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { EmbeddingChunk, DocumentType } from '../embeddings';

// Mock Supabase client
const mockUpsert = vi.fn();
const mockRpc = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

// Helper to create a mock embedding chunk
function createMockChunk(overrides: Partial<EmbeddingChunk> = {}): EmbeddingChunk {
  return {
    document_type: 'companies',
    document_id: 'doc-123',
    chunk_index: 0,
    chunk_text: 'Sample text content for embedding',
    token_count: 10,
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
    ...overrides,
  };
}

describe('embeddingsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain setup for delete
    mockEq.mockReturnValue({ eq: mockEq, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    // Default chain setup for select (count)
    mockSelect.mockReturnValue({
      eq: mockEq,
      count: null,
      error: null
    });

    // Default from setup
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      delete: mockDelete,
      select: mockSelect,
    });

    // Default upsert setup
    mockUpsert.mockResolvedValue({ error: null });

    // Default RPC setup
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  describe('upsert', () => {
    it('returns early for empty array without calling database', async () => {
      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.upsert([]);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('converts embeddings to pgvector string format', async () => {
      const chunk = createMockChunk({
        embedding: [0.1, 0.2, 0.3],
      });

      mockUpsert.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.upsert([chunk]);

      expect(mockFrom).toHaveBeenCalledWith('document_embeddings');
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            document_type: 'companies',
            document_id: 'doc-123',
            chunk_index: 0,
            chunk_text: 'Sample text content for embedding',
            token_count: 10,
            embedding: '[0.1,0.2,0.3]', // Converted to string
          }),
        ],
        { onConflict: 'document_type,document_id,chunk_index' }
      );
    });

    it('processes multiple chunks in a single batch when under limit', async () => {
      const chunks = [
        createMockChunk({ chunk_index: 0 }),
        createMockChunk({ chunk_index: 1 }),
        createMockChunk({ chunk_index: 2 }),
      ];

      mockUpsert.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.upsert(chunks);

      // Should only call upsert once for 3 chunks (under BATCH_SIZE of 50)
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ chunk_index: 0 }),
          expect.objectContaining({ chunk_index: 1 }),
          expect.objectContaining({ chunk_index: 2 }),
        ]),
        expect.any(Object)
      );
    });

    it('processes in batches for large arrays (over 50 chunks)', async () => {
      // Create 75 chunks to test batching (BATCH_SIZE = 50)
      const chunks = Array.from({ length: 75 }, (_, i) =>
        createMockChunk({ chunk_index: i })
      );

      mockUpsert.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.upsert(chunks);

      // Should call upsert twice: first batch of 50, second batch of 25
      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });

    it('throws RepositoryError on database error', async () => {
      const chunk = createMockChunk();

      mockUpsert.mockResolvedValue({
        error: { message: 'Database error', code: '42P01' },
      });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const { embeddingsRepo } = await import('../embeddings');

      await expect(embeddingsRepo.upsert([chunk])).rejects.toThrow();
    });
  });

  describe('search', () => {
    it('calls RPC with correct parameters and converted embedding', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const mockResults = [
        {
          id: 'result-1',
          document_type: 'companies',
          document_id: 'doc-1',
          chunk_index: 0,
          chunk_text: 'Matching content',
          similarity: 0.95,
        },
      ];

      mockRpc.mockResolvedValue({ data: mockResults, error: null });

      const { embeddingsRepo } = await import('../embeddings');

      const results = await embeddingsRepo.search(queryEmbedding);

      expect(mockRpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: '[0.1,0.2,0.3]', // Converted to string
        match_threshold: 0.7, // Default
        match_count: 10, // Default
        filter_type: undefined,
      });
      expect(results).toEqual(mockResults);
    });

    it('uses custom threshold and count when provided', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];

      mockRpc.mockResolvedValue({ data: [], error: null });

      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.search(queryEmbedding, 0.8, 5);

      expect(mockRpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: '[0.1,0.2,0.3]',
        match_threshold: 0.8,
        match_count: 5,
        filter_type: undefined,
      });
    });

    it('passes filter type when provided', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const filterType: DocumentType = 'products';

      mockRpc.mockResolvedValue({ data: [], error: null });

      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.search(queryEmbedding, 0.7, 10, filterType);

      expect(mockRpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: '[0.1,0.2,0.3]',
        match_threshold: 0.7,
        match_count: 10,
        filter_type: 'products',
      });
    });

    it('returns empty array when no matches found', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const { embeddingsRepo } = await import('../embeddings');

      const results = await embeddingsRepo.search([0.1, 0.2, 0.3]);

      expect(results).toEqual([]);
    });

    it('throws RepositoryError on RPC error', async () => {
      mockRpc.mockResolvedValue({
        error: { message: 'RPC error', code: 'PGRST' },
      });

      const { embeddingsRepo } = await import('../embeddings');

      await expect(embeddingsRepo.search([0.1, 0.2, 0.3])).rejects.toThrow();
    });
  });

  describe('deleteByDocument', () => {
    it('deletes embeddings with correct filters', async () => {
      const documentType: DocumentType = 'companies';
      const documentId = 'doc-123';

      // Chain: from().delete().eq().eq()
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
      const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
      mockDelete.mockReturnValue({ eq: mockFirstEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const { embeddingsRepo } = await import('../embeddings');

      await embeddingsRepo.deleteByDocument(documentType, documentId);

      expect(mockFrom).toHaveBeenCalledWith('document_embeddings');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockFirstEq).toHaveBeenCalledWith('document_type', 'companies');
      expect(mockSecondEq).toHaveBeenCalledWith('document_id', 'doc-123');
    });

    it('throws RepositoryError on database error', async () => {
      const mockSecondEq = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed', code: '42P01' },
      });
      const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
      mockDelete.mockReturnValue({ eq: mockFirstEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const { embeddingsRepo } = await import('../embeddings');

      await expect(
        embeddingsRepo.deleteByDocument('companies', 'doc-123')
      ).rejects.toThrow();
    });
  });

  describe('getCount', () => {
    it('returns count without filter', async () => {
      mockSelect.mockResolvedValue({ count: 42, error: null });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { embeddingsRepo } = await import('../embeddings');

      const count = await embeddingsRepo.getCount();

      expect(mockFrom).toHaveBeenCalledWith('document_embeddings');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(count).toBe(42);
    });

    it('returns count filtered by document type', async () => {
      const mockEqResult = vi.fn().mockResolvedValue({ count: 15, error: null });
      mockSelect.mockReturnValue({ eq: mockEqResult });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { embeddingsRepo } = await import('../embeddings');

      const count = await embeddingsRepo.getCount('products');

      expect(mockEqResult).toHaveBeenCalledWith('document_type', 'products');
      expect(count).toBe(15);
    });

    it('returns 0 when count is null', async () => {
      mockSelect.mockResolvedValue({ count: null, error: null });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { embeddingsRepo } = await import('../embeddings');

      const count = await embeddingsRepo.getCount();

      expect(count).toBe(0);
    });

    it('throws RepositoryError on database error', async () => {
      mockSelect.mockResolvedValue({
        count: null,
        error: { message: 'Count failed', code: '42P01' },
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { embeddingsRepo } = await import('../embeddings');

      await expect(embeddingsRepo.getCount()).rejects.toThrow();
    });
  });
});

describe('toVectorString (internal helper)', () => {
  it('converts number array to pgvector format', async () => {
    // We test this indirectly through upsert behavior
    const chunk = createMockChunk({
      embedding: [1, 2, 3, 4, 5],
    });

    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    const { embeddingsRepo } = await import('../embeddings');

    await embeddingsRepo.upsert([chunk]);

    expect(mockUpsert).toHaveBeenCalledWith(
      [expect.objectContaining({ embedding: '[1,2,3,4,5]' })],
      expect.any(Object)
    );
  });

  it('handles floating point numbers', async () => {
    const chunk = createMockChunk({
      embedding: [0.123456789, -0.987654321, 0],
    });

    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    const { embeddingsRepo } = await import('../embeddings');

    await embeddingsRepo.upsert([chunk]);

    expect(mockUpsert).toHaveBeenCalledWith(
      [expect.objectContaining({ embedding: '[0.123456789,-0.987654321,0]' })],
      expect.any(Object)
    );
  });

  it('handles empty array', async () => {
    const chunk = createMockChunk({
      embedding: [],
    });

    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    const { embeddingsRepo } = await import('../embeddings');

    await embeddingsRepo.upsert([chunk]);

    expect(mockUpsert).toHaveBeenCalledWith(
      [expect.objectContaining({ embedding: '[]' })],
      expect.any(Object)
    );
  });
});
