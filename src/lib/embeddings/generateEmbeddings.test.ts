/**
 * Embedding Generation Tests
 *
 * Tests for the embedding generation orchestration layer.
 * Mocks chunker, OpenAI, and repository to test logic in isolation.
 *
 * @see Story 15-1: Document Embeddings Infrastructure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { TextChunk } from './chunker';
import type { EmbeddingChunk, DocumentType } from '@/lib/repositories/embeddings';

// Mock dependencies
vi.mock('./chunker', () => ({
  chunkMarkdown: vi.fn(),
}));

vi.mock('./openai', () => ({
  generateEmbeddings: vi.fn(),
}));

vi.mock('@/lib/repositories/embeddings', () => ({
  embeddingsRepo: {
    upsert: vi.fn(),
    deleteOrphanChunks: vi.fn(),
  },
}));

vi.mock('./contentExtractor', () => ({
  extractCompanyContent: vi.fn(),
  extractProductContent: vi.fn(),
  extractConsumerContent: vi.fn(),
  extractTrendContent: vi.fn(),
  extractResearchDocContent: vi.fn(),
}));

// Import mocked modules
import { chunkMarkdown } from './chunker';
import { generateEmbeddings as generateEmbeddingsOpenAI } from './openai';
import { embeddingsRepo } from '@/lib/repositories/embeddings';
import {
  extractCompanyContent,
  extractProductContent,
  extractConsumerContent,
  extractTrendContent,
  extractResearchDocContent,
} from './contentExtractor';

// Import functions to test
import {
  embedDocument,
  embedCompany,
  embedProduct,
  embedConsumer,
  embedTrend,
  embedResearchDoc,
  embedAllDocuments,
  type DocumentItem,
  type ProgressCallback,
} from './generateEmbeddings';

// Helper to create mock text chunks
function createMockChunks(count: number): TextChunk[] {
  return Array.from({ length: count }, (_, i) => ({
    text: `Chunk ${i} content`,
    index: i,
    tokenCount: 50 + i * 10,
  }));
}

// Helper to create mock embeddings
function createMockEmbeddings(count: number): number[][] {
  return Array.from({ length: count }, (_, i) =>
    Array.from({ length: 5 }, (_, j) => i * 0.1 + j * 0.01)
  );
}

describe('embedDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success with 0 chunks for empty content', async () => {
    const result = await embedDocument('companies', 'doc-123', '');

    expect(result).toEqual({
      documentType: 'companies',
      documentId: 'doc-123',
      chunksCreated: 0,
      success: true,
    });
    expect(chunkMarkdown).not.toHaveBeenCalled();
  });

  it('returns success with 0 chunks for whitespace-only content', async () => {
    const result = await embedDocument('companies', 'doc-123', '   \n\t  ');

    expect(result).toEqual({
      documentType: 'companies',
      documentId: 'doc-123',
      chunksCreated: 0,
      success: true,
    });
  });

  it('returns success with 0 chunks when chunker returns empty array', async () => {
    vi.mocked(chunkMarkdown).mockReturnValue([]);

    const result = await embedDocument('companies', 'doc-123', 'Some content');

    expect(result).toEqual({
      documentType: 'companies',
      documentId: 'doc-123',
      chunksCreated: 0,
      success: true,
    });
    expect(chunkMarkdown).toHaveBeenCalledWith('Some content');
  });

  it('generates and stores embeddings for valid content', async () => {
    const mockChunks = createMockChunks(2);
    const mockEmbeddings = createMockEmbeddings(2);

    vi.mocked(chunkMarkdown).mockReturnValue(mockChunks);
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(mockEmbeddings);
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    const result = await embedDocument('products', 'product-456', 'Product content here');

    expect(result).toEqual({
      documentType: 'products',
      documentId: 'product-456',
      chunksCreated: 2,
      success: true,
    });

    // Verify chunking
    expect(chunkMarkdown).toHaveBeenCalledWith('Product content here');

    // Verify embedding generation
    expect(generateEmbeddingsOpenAI).toHaveBeenCalledWith(['Chunk 0 content', 'Chunk 1 content']);

    // Verify upsert with correct structure
    expect(embeddingsRepo.upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        document_type: 'products',
        document_id: 'product-456',
        chunk_index: 0,
        chunk_text: 'Chunk 0 content',
        token_count: 50,
        embedding: mockEmbeddings[0],
      }),
      expect.objectContaining({
        document_type: 'products',
        document_id: 'product-456',
        chunk_index: 1,
        chunk_text: 'Chunk 1 content',
        token_count: 60,
        embedding: mockEmbeddings[1],
      }),
    ]);

    // Verify orphan chunks cleanup
    expect(embeddingsRepo.deleteOrphanChunks).toHaveBeenCalledWith('products', 'product-456', 2);
  });

  it('upserts first then cleans up orphan chunks', async () => {
    const mockChunks = createMockChunks(1);
    const mockEmbeddings = createMockEmbeddings(1);

    vi.mocked(chunkMarkdown).mockReturnValue(mockChunks);
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(mockEmbeddings);
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    await embedDocument('companies', 'doc-123', 'Content');

    // Verify order: upsert called before deleteOrphanChunks (safer - preserves data on failure)
    const upsertCall = vi.mocked(embeddingsRepo.upsert).mock.invocationCallOrder[0];
    const deleteCall = vi.mocked(embeddingsRepo.deleteOrphanChunks).mock.invocationCallOrder[0];
    expect(upsertCall).toBeLessThan(deleteCall);
  });

  it('returns failure result on chunker error', async () => {
    vi.mocked(chunkMarkdown).mockImplementation(() => {
      throw new Error('Chunker failed');
    });

    const result = await embedDocument('companies', 'doc-123', 'Content');

    expect(result).toEqual({
      documentType: 'companies',
      documentId: 'doc-123',
      chunksCreated: 0,
      success: false,
      error: 'Chunker failed',
    });
  });

  it('returns failure result on embedding generation error', async () => {
    vi.mocked(chunkMarkdown).mockReturnValue(createMockChunks(1));
    vi.mocked(generateEmbeddingsOpenAI).mockRejectedValue(new Error('OpenAI API error'));

    const result = await embedDocument('companies', 'doc-123', 'Content');

    expect(result).toEqual({
      documentType: 'companies',
      documentId: 'doc-123',
      chunksCreated: 0,
      success: false,
      error: 'OpenAI API error',
    });
  });

  it('returns failure result on repository error', async () => {
    vi.mocked(chunkMarkdown).mockReturnValue(createMockChunks(1));
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(createMockEmbeddings(1));
    vi.mocked(embeddingsRepo.upsert).mockRejectedValue(new Error('DB connection failed'));

    const result = await embedDocument('companies', 'doc-123', 'Content');

    expect(result).toEqual({
      documentType: 'companies',
      documentId: 'doc-123',
      chunksCreated: 0,
      success: false,
      error: 'DB connection failed',
    });
  });

  it('handles non-Error thrown values', async () => {
    vi.mocked(chunkMarkdown).mockImplementation(() => {
      throw 'string error';
    });

    const result = await embedDocument('companies', 'doc-123', 'Content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});

describe('Entity-specific embed functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup successful embedding flow
    vi.mocked(chunkMarkdown).mockReturnValue(createMockChunks(1));
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(createMockEmbeddings(1));
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);
  });

  it('embedCompany extracts content and embeds with correct type', async () => {
    const mockCompany = {
      id: 'company-123',
      name: 'Test Company',
      category: 'snacks',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      distribution_reach: null,
      market_share: null,
      products: null,
      raw_content: null,
      revenue_estimate: null,
      source_file: null,
      strengths: null,
      weaknesses: null,
    };

    vi.mocked(extractCompanyContent).mockReturnValue('Company extracted content');

    const result = await embedCompany(mockCompany);

    expect(extractCompanyContent).toHaveBeenCalledWith(mockCompany);
    expect(chunkMarkdown).toHaveBeenCalledWith('Company extracted content');
    expect(result.documentType).toBe('companies');
    expect(result.documentId).toBe('company-123');
  });

  it('embedProduct extracts content and embeds with correct type', async () => {
    const mockProduct = {
      id: 'product-123',
      name: 'Test Product',
      category: 'chips',
      company_id: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      flavor_profile: null,
      market_position: null,
      price_point: null,
      price_tier: null,
      source_file: null,
    };

    vi.mocked(extractProductContent).mockReturnValue('Product extracted content');

    const result = await embedProduct(mockProduct);

    expect(extractProductContent).toHaveBeenCalledWith(mockProduct);
    expect(result.documentType).toBe('products');
    expect(result.documentId).toBe('product-123');
  });

  it('embedConsumer extracts content and embeds with correct type', async () => {
    const mockConsumer = {
      id: 'consumer-123',
      segment_name: 'Young Adults',
      behaviors: null,
      demographics: null,
      pain_points: null,
      preferences: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      source_file: null,
    };

    vi.mocked(extractConsumerContent).mockReturnValue('Consumer extracted content');

    const result = await embedConsumer(mockConsumer);

    expect(extractConsumerContent).toHaveBeenCalledWith(mockConsumer);
    expect(result.documentType).toBe('consumers');
    expect(result.documentId).toBe('consumer-123');
  });

  it('embedTrend extracts content and embeds with correct type', async () => {
    const mockTrend = {
      id: 'trend-123',
      name: 'Health Snacking',
      category: null,
      description: null,
      growth_rate: null,
      status: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      source_file: null,
    };

    vi.mocked(extractTrendContent).mockReturnValue('Trend extracted content');

    const result = await embedTrend(mockTrend);

    expect(extractTrendContent).toHaveBeenCalledWith(mockTrend);
    expect(result.documentType).toBe('trends');
    expect(result.documentId).toBe('trend-123');
  });

  it('embedResearchDoc extracts content and embeds with correct type', async () => {
    const mockDoc = {
      id: 'doc-123',
      title: 'Market Analysis',
      category: null,
      content: null,
      summary: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      source_file: null,
    };

    vi.mocked(extractResearchDocContent).mockReturnValue('Research doc content');

    const result = await embedResearchDoc(mockDoc);

    expect(extractResearchDocContent).toHaveBeenCalledWith(mockDoc);
    expect(result.documentType).toBe('research_docs');
    expect(result.documentId).toBe('doc-123');
  });
});

describe('embedAllDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes all documents and returns aggregate results', async () => {
    vi.mocked(chunkMarkdown).mockReturnValue(createMockChunks(2));
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(createMockEmbeddings(2));
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    const documents: DocumentItem[] = [
      { type: 'companies', id: 'company-1', content: 'Company 1 content' },
      { type: 'products', id: 'product-1', content: 'Product 1 content' },
      { type: 'consumers', id: 'consumer-1', content: 'Consumer 1 content' },
    ];

    const result = await embedAllDocuments(documents);

    expect(result.total).toBe(3);
    expect(result.succeeded).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(3);
    expect(result.results.every(r => r.success)).toBe(true);
  });

  it('continues processing after failures', async () => {
    // First call fails, second and third succeed
    vi.mocked(chunkMarkdown)
      .mockImplementationOnce(() => {
        throw new Error('First doc failed');
      })
      .mockReturnValue(createMockChunks(1));
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(createMockEmbeddings(1));
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    const documents: DocumentItem[] = [
      { type: 'companies', id: 'fail-doc', content: 'Will fail' },
      { type: 'products', id: 'success-1', content: 'Will succeed' },
      { type: 'consumers', id: 'success-2', content: 'Will also succeed' },
    ];

    const result = await embedAllDocuments(documents);

    expect(result.total).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('First doc failed');
    expect(result.results[1].success).toBe(true);
    expect(result.results[2].success).toBe(true);
  });

  it('calls progress callback with correct values', async () => {
    vi.mocked(chunkMarkdown).mockReturnValue(createMockChunks(1));
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(createMockEmbeddings(1));
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    const documents: DocumentItem[] = [
      { type: 'companies', id: 'doc-1', content: 'Content 1' },
      { type: 'products', id: 'doc-2', content: 'Content 2' },
    ];

    const progressCallback: ProgressCallback = vi.fn();

    await embedAllDocuments(documents, progressCallback);

    expect(progressCallback).toHaveBeenCalledTimes(2);
    expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 2, { type: 'companies', id: 'doc-1' });
    expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 2, { type: 'products', id: 'doc-2' });
  });

  it('handles empty documents array', async () => {
    const result = await embedAllDocuments([]);

    expect(result).toEqual({
      total: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });
  });

  it('processes documents sequentially (not in parallel)', async () => {
    const callOrder: string[] = [];

    vi.mocked(chunkMarkdown).mockImplementation((content) => {
      callOrder.push(`chunk:${content}`);
      return createMockChunks(1);
    });
    vi.mocked(generateEmbeddingsOpenAI).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return createMockEmbeddings(1);
    });
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    const documents: DocumentItem[] = [
      { type: 'companies', id: 'doc-1', content: 'A' },
      { type: 'products', id: 'doc-2', content: 'B' },
      { type: 'consumers', id: 'doc-3', content: 'C' },
    ];

    await embedAllDocuments(documents);

    // Verify sequential processing by checking chunk call order
    expect(callOrder).toEqual(['chunk:A', 'chunk:B', 'chunk:C']);
  });

  it('tracks chunks created per document', async () => {
    // Different chunk counts for each document
    vi.mocked(chunkMarkdown)
      .mockReturnValueOnce(createMockChunks(3))
      .mockReturnValueOnce(createMockChunks(1))
      .mockReturnValueOnce(createMockChunks(5));
    vi.mocked(generateEmbeddingsOpenAI)
      .mockResolvedValueOnce(createMockEmbeddings(3))
      .mockResolvedValueOnce(createMockEmbeddings(1))
      .mockResolvedValueOnce(createMockEmbeddings(5));
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    const documents: DocumentItem[] = [
      { type: 'companies', id: 'doc-1', content: 'Content 1' },
      { type: 'products', id: 'doc-2', content: 'Content 2' },
      { type: 'consumers', id: 'doc-3', content: 'Content 3' },
    ];

    const result = await embedAllDocuments(documents);

    expect(result.results[0].chunksCreated).toBe(3);
    expect(result.results[1].chunksCreated).toBe(1);
    expect(result.results[2].chunksCreated).toBe(5);
  });
});

describe('EmbeddingChunk structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates chunks with all required fields', async () => {
    const mockChunks: TextChunk[] = [
      { text: 'First chunk text', index: 0, tokenCount: 100 },
      { text: 'Second chunk text', index: 1, tokenCount: 150 },
    ];
    const mockEmbeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];

    vi.mocked(chunkMarkdown).mockReturnValue(mockChunks);
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(mockEmbeddings);
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    await embedDocument('trends', 'trend-123', 'Trend content');

    const upsertCall = vi.mocked(embeddingsRepo.upsert).mock.calls[0][0] as EmbeddingChunk[];

    expect(upsertCall).toHaveLength(2);

    // First chunk
    expect(upsertCall[0]).toEqual({
      document_type: 'trends',
      document_id: 'trend-123',
      chunk_index: 0,
      chunk_text: 'First chunk text',
      token_count: 100,
      embedding: [0.1, 0.2, 0.3],
    });

    // Second chunk
    expect(upsertCall[1]).toEqual({
      document_type: 'trends',
      document_id: 'trend-123',
      chunk_index: 1,
      chunk_text: 'Second chunk text',
      token_count: 150,
      embedding: [0.4, 0.5, 0.6],
    });
  });

  it('uses sequential indices regardless of chunker indices', async () => {
    // Simulate non-sequential indices from chunker (e.g., after filtering)
    // The implementation should use sequential array indices (0, 1, 2)
    // NOT the chunker's potentially gapped indices (0, 2, 5)
    const mockChunks: TextChunk[] = [
      { text: 'Chunk A', index: 0, tokenCount: 50 },
      { text: 'Chunk B', index: 2, tokenCount: 50 }, // Chunker's index 2
      { text: 'Chunk C', index: 5, tokenCount: 50 }, // Chunker's index 5
    ];
    const mockEmbeddings = createMockEmbeddings(3);

    vi.mocked(chunkMarkdown).mockReturnValue(mockChunks);
    vi.mocked(generateEmbeddingsOpenAI).mockResolvedValue(mockEmbeddings);
    vi.mocked(embeddingsRepo.upsert).mockResolvedValue(undefined);
    vi.mocked(embeddingsRepo.deleteOrphanChunks).mockResolvedValue(undefined);

    await embedDocument('companies', 'doc-123', 'Content');

    const upsertCall = vi.mocked(embeddingsRepo.upsert).mock.calls[0][0] as EmbeddingChunk[];

    // Should use sequential array indices (0, 1, 2) to match embedding positions
    expect(upsertCall[0].chunk_index).toBe(0);
    expect(upsertCall[1].chunk_index).toBe(1);
    expect(upsertCall[2].chunk_index).toBe(2);
  });
});
