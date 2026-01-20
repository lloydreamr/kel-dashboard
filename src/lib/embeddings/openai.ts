/**
 * OpenAI Embeddings Service
 *
 * ⚠️ SERVER-SIDE ONLY - Never import this module in 'use client' components.
 *
 * Generates vector embeddings using OpenAI's text-embedding-3-small model.
 * Includes:
 * - Automatic batching (max 2048 inputs per request)
 * - Retry logic with exponential backoff
 * - Concurrency limiting to avoid rate limits
 */

import OpenAI from 'openai';
import pRetry from 'p-retry';
import pLimit from 'p-limit';

/**
 * OpenAI model for embeddings
 * text-embedding-3-small: 1536 dimensions, $0.02/1M tokens
 */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Maximum inputs per API request
 * OpenAI allows up to 2048 inputs per batch request
 */
const MAX_BATCH_SIZE = 2048;

/**
 * Maximum concurrent API requests
 * Prevents hitting rate limits
 */
const CONCURRENT_LIMIT = 5;

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  retries: 3,
  minTimeout: 1000,
  factor: 2,
};

// Concurrency limiter
const limit = pLimit(CONCURRENT_LIMIT);

/**
 * Embedding dimensions for this model
 * Used for validation
 */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Create OpenAI client
 * Lazily initialized to avoid errors when API key is not set
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for embedding generation'
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Validate OpenAI configuration before starting batch operations
 * Call this at startup to fail fast instead of mid-batch
 *
 * @throws Error if OPENAI_API_KEY is not set
 */
export function validateOpenAIConfig(): void {
  getOpenAIClient();
}

/**
 * Generate embeddings for multiple text inputs
 *
 * Handles large input arrays by batching and includes retry logic.
 *
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (1536 dimensions each)
 * @throws Error if OpenAI API call fails after retries
 *
 * @example
 * const embeddings = await generateEmbeddings(['Hello world', 'How are you?']);
 * // embeddings[0] = [0.123, -0.456, ...] (1536 numbers)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Filter out empty strings
  const validTexts = texts.filter(t => t.trim().length > 0);
  if (validTexts.length === 0) {
    return [];
  }

  const openai = getOpenAIClient();

  // Split into batches
  const batches: string[][] = [];
  for (let i = 0; i < validTexts.length; i += MAX_BATCH_SIZE) {
    batches.push(validTexts.slice(i, i + MAX_BATCH_SIZE));
  }

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const embeddings = await limit(() =>
      pRetry(
        async () => {
          const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: batch,
            encoding_format: 'float',
          });

          // Validate response count matches input count
          if (response.data.length !== batch.length) {
            throw new Error(
              `OpenAI returned ${response.data.length} embeddings for ${batch.length} inputs. ` +
              `Some inputs may have been rejected by content policy.`
            );
          }

          // Sort by index to maintain order (OpenAI may return out of order)
          const sortedEmbeddings = response.data
            .sort((a, b) => a.index - b.index)
            .map(item => item.embedding);

          // Validate embedding dimensions
          const invalidDimension = sortedEmbeddings.find(
            e => e.length !== EMBEDDING_DIMENSIONS
          );
          if (invalidDimension) {
            throw new Error(
              `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${invalidDimension.length}. ` +
              `Model may have changed or returned invalid data.`
            );
          }

          return sortedEmbeddings;
        },
        {
          ...RETRY_CONFIG,
          onFailedAttempt: error => {
            console.warn(
              `OpenAI embedding attempt ${error.attemptNumber} failed. ` +
              `${RETRY_CONFIG.retries - error.attemptNumber + 1} retries left.`
            );
          },
        }
      )
    );

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Generate embedding for a single query string
 *
 * Convenience wrapper for search queries.
 *
 * @param query - The search query text
 * @returns Single embedding vector (1536 dimensions)
 *
 * @example
 * const queryVector = await generateQueryEmbedding('What snacks are popular?');
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([query]);
  if (!embedding) {
    throw new Error('Failed to generate embedding for query');
  }
  return embedding;
}

