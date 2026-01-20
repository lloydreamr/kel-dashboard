/**
 * OpenAI Embeddings Service Tests
 *
 * Tests for embedding generation, batching, validation, and error handling.
 * Mocks OpenAI client to test logic in isolation.
 *
 * @see Story 15-1: Document Embeddings Infrastructure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock function for embeddings.create
const mockCreate = vi.fn();

// Mock OpenAI as a class
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      embeddings = {
        create: mockCreate,
      };
    },
  };
});

// Mock p-retry to execute immediately without retries
vi.mock('p-retry', () => ({
  default: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

// Mock p-limit to execute immediately
vi.mock('p-limit', () => ({
  default: vi.fn(() => (fn: () => Promise<unknown>) => fn()),
}));

// Helper to create mock embedding response
function createMockResponse(count: number, dimensions = 1536) {
  return {
    data: Array.from({ length: count }, (_, i) => ({
      index: i,
      embedding: Array(dimensions).fill(0.1),
    })),
    model: 'text-embedding-3-small',
    usage: { prompt_tokens: count * 10, total_tokens: count * 10 },
  };
}

describe('OpenAI Embeddings Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state by clearing the cached client
    vi.resetModules();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateOpenAIConfig', () => {
    it('succeeds when API key is set', async () => {
      const { validateOpenAIConfig } = await import('./openai');
      expect(() => validateOpenAIConfig()).not.toThrow();
    });

    it('throws when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;
      vi.resetModules();
      const { validateOpenAIConfig } = await import('./openai');
      expect(() => validateOpenAIConfig()).toThrow(
        'OPENAI_API_KEY environment variable is required'
      );
    });
  });

  describe('generateEmbeddings', () => {
    describe('input handling', () => {
      it('returns empty array for empty input', async () => {
        const { generateEmbeddings } = await import('./openai');
        const result = await generateEmbeddings([]);
        expect(result).toEqual([]);
        expect(mockCreate).not.toHaveBeenCalled();
      });

      it('returns empty array for whitespace-only inputs', async () => {
        const { generateEmbeddings } = await import('./openai');
        const result = await generateEmbeddings(['  ', '\t', '\n', '']);
        expect(result).toEqual([]);
        expect(mockCreate).not.toHaveBeenCalled();
      });

      it('filters out empty strings from mixed input', async () => {
        mockCreate.mockResolvedValueOnce(createMockResponse(2));
        const { generateEmbeddings } = await import('./openai');

        await generateEmbeddings(['hello', '', 'world', '  ']);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            input: ['hello', 'world'],
          })
        );
      });

      it('generates embedding for single input', async () => {
        mockCreate.mockResolvedValueOnce(createMockResponse(1));
        const { generateEmbeddings } = await import('./openai');

        const result = await generateEmbeddings(['test input']);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(1536);
        expect(mockCreate).toHaveBeenCalledWith({
          model: 'text-embedding-3-small',
          input: ['test input'],
          encoding_format: 'float',
        });
      });

      it('generates embeddings for multiple inputs', async () => {
        mockCreate.mockResolvedValueOnce(createMockResponse(3));
        const { generateEmbeddings } = await import('./openai');

        const result = await generateEmbeddings(['one', 'two', 'three']);

        expect(result).toHaveLength(3);
        expect(result.every(e => e.length === 1536)).toBe(true);
      });
    });

    describe('batching', () => {
      it('processes single batch for inputs under 2048', async () => {
        mockCreate.mockResolvedValueOnce(createMockResponse(100));
        const { generateEmbeddings } = await import('./openai');

        const inputs = Array(100).fill('test');
        await generateEmbeddings(inputs);

        expect(mockCreate).toHaveBeenCalledTimes(1);
      });

      it('splits into multiple batches for inputs over 2048', async () => {
        // First batch: 2048, Second batch: 100
        mockCreate
          .mockResolvedValueOnce(createMockResponse(2048))
          .mockResolvedValueOnce(createMockResponse(100));

        const { generateEmbeddings } = await import('./openai');
        const inputs = Array(2148).fill('test');

        const result = await generateEmbeddings(inputs);

        expect(mockCreate).toHaveBeenCalledTimes(2);
        expect(result).toHaveLength(2148);
      });

      it('handles exactly 2048 inputs in single batch', async () => {
        mockCreate.mockResolvedValueOnce(createMockResponse(2048));
        const { generateEmbeddings } = await import('./openai');

        const inputs = Array(2048).fill('test');
        await generateEmbeddings(inputs);

        expect(mockCreate).toHaveBeenCalledTimes(1);
      });

      it('handles 2049 inputs (splits into 2048 + 1)', async () => {
        mockCreate
          .mockResolvedValueOnce(createMockResponse(2048))
          .mockResolvedValueOnce(createMockResponse(1));

        const { generateEmbeddings } = await import('./openai');
        const inputs = Array(2049).fill('test');

        const result = await generateEmbeddings(inputs);

        expect(mockCreate).toHaveBeenCalledTimes(2);
        expect(result).toHaveLength(2049);
      });
    });

    describe('response ordering', () => {
      it('sorts response by index when returned out of order', async () => {
        // Create response where indices are scrambled
        const unorderedResponse = {
          data: [
            { index: 2, embedding: Array(1536).fill(0.3) },
            { index: 0, embedding: Array(1536).fill(0.1) },
            { index: 1, embedding: Array(1536).fill(0.2) },
          ],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 30, total_tokens: 30 },
        };
        mockCreate.mockResolvedValueOnce(unorderedResponse);

        const { generateEmbeddings } = await import('./openai');
        const result = await generateEmbeddings(['a', 'b', 'c']);

        // Should be sorted by index: 0.1, 0.2, 0.3
        expect(result[0][0]).toBe(0.1);
        expect(result[1][0]).toBe(0.2);
        expect(result[2][0]).toBe(0.3);
      });
    });

    describe('validation', () => {
      it('throws when response count does not match input count', async () => {
        // Return 2 embeddings for 3 inputs
        mockCreate.mockResolvedValueOnce(createMockResponse(2));
        const { generateEmbeddings } = await import('./openai');

        await expect(generateEmbeddings(['a', 'b', 'c'])).rejects.toThrow(
          'OpenAI returned 2 embeddings for 3 inputs'
        );
      });

      it('throws when embedding dimensions are wrong', async () => {
        // Return embeddings with 512 dimensions instead of 1536
        mockCreate.mockResolvedValueOnce(createMockResponse(1, 512));
        const { generateEmbeddings } = await import('./openai');

        await expect(generateEmbeddings(['test'])).rejects.toThrow(
          'Expected 1536 dimensions, got 512'
        );
      });

      it('throws when some embeddings have wrong dimensions', async () => {
        mockCreate.mockResolvedValueOnce({
          data: [
            { index: 0, embedding: Array(1536).fill(0.1) },
            { index: 1, embedding: Array(1024).fill(0.1) }, // Wrong dimensions
          ],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 20, total_tokens: 20 },
        });
        const { generateEmbeddings } = await import('./openai');

        await expect(generateEmbeddings(['a', 'b'])).rejects.toThrow(
          'Expected 1536 dimensions, got 1024'
        );
      });
    });

    describe('error handling', () => {
      it('throws when API key is missing', async () => {
        delete process.env.OPENAI_API_KEY;
        vi.resetModules();
        const { generateEmbeddings } = await import('./openai');

        await expect(generateEmbeddings(['test'])).rejects.toThrow(
          'OPENAI_API_KEY environment variable is required'
        );
      });

      it('throws when OpenAI API fails', async () => {
        mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));
        const { generateEmbeddings } = await import('./openai');

        await expect(generateEmbeddings(['test'])).rejects.toThrow(
          'API rate limit exceeded'
        );
      });
    });
  });

  describe('generateQueryEmbedding', () => {
    it('returns single embedding for query', async () => {
      mockCreate.mockResolvedValueOnce(createMockResponse(1));
      const { generateQueryEmbedding } = await import('./openai');

      const result = await generateQueryEmbedding('What snacks are popular?');

      expect(result).toHaveLength(1536);
    });

    it('throws for empty query', async () => {
      const { generateQueryEmbedding } = await import('./openai');

      await expect(generateQueryEmbedding('')).rejects.toThrow(
        'Failed to generate embedding for query'
      );
    });

    it('throws for whitespace-only query', async () => {
      const { generateQueryEmbedding } = await import('./openai');

      await expect(generateQueryEmbedding('   ')).rejects.toThrow(
        'Failed to generate embedding for query'
      );
    });
  });

  describe('EMBEDDING_DIMENSIONS', () => {
    it('exports correct dimension constant', async () => {
      const { EMBEDDING_DIMENSIONS } = await import('./openai');
      expect(EMBEDDING_DIMENSIONS).toBe(1536);
    });
  });
});
