/**
 * Text Chunking Utility
 *
 * Splits documents into optimal chunks for embedding generation.
 * Uses heading-aware splitting for markdown, with token-based
 * subdivision for long sections.
 *
 * Target: 500-800 tokens per chunk with ~100 token overlap.
 * This balances semantic coherence with embedding model context limits.
 */

import { encode } from 'gpt-tokenizer';

/**
 * Maximum tokens per chunk
 * OpenAI recommends keeping chunks under 8191 tokens,
 * but smaller chunks (500-800) provide better retrieval precision.
 */
const MAX_TOKENS = 800;

/**
 * Token overlap between adjacent chunks
 * Ensures context continuity when searching across chunk boundaries.
 */
const OVERLAP_TOKENS = 100;

/**
 * Minimum tokens for a chunk to be included
 * Avoids creating tiny chunks from empty sections or whitespace.
 * Set low to preserve small but meaningful sections.
 */
const MIN_TOKENS = 20;

/**
 * A single chunk of text with metadata
 */
export interface TextChunk {
  /** The chunk text content */
  text: string;
  /** Zero-based index of this chunk in the document */
  index: number;
  /** Actual token count (using GPT tokenizer) */
  tokenCount: number;
}

/**
 * Chunk markdown content intelligently
 *
 * Strategy:
 * 1. Split by H2 headings (##) to preserve semantic sections
 * 2. If a section is too long, subdivide by token count with overlap
 * 3. Skip empty or very short sections
 *
 * @param markdown - The full markdown document
 * @returns Array of text chunks with metadata
 */
export function chunkMarkdown(markdown: string): TextChunk[] {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  // Split by H2 headings while keeping the heading with its content
  const sections = markdown.split(/(?=^## )/m);
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const tokens = encode(trimmed);

    // Skip very short sections
    if (tokens.length < MIN_TOKENS) {
      continue;
    }

    if (tokens.length <= MAX_TOKENS) {
      // Section fits in one chunk
      chunks.push({
        text: trimmed,
        index: chunkIndex++,
        tokenCount: tokens.length,
      });
    } else {
      // Section is too long - subdivide with overlap
      const subChunks = chunkByTokens(trimmed, MAX_TOKENS, OVERLAP_TOKENS);
      for (const subChunk of subChunks) {
        // Only include chunks that meet minimum size
        if (subChunk.tokenCount >= MIN_TOKENS) {
          chunks.push({
            text: subChunk.text,
            index: chunkIndex++,
            tokenCount: subChunk.tokenCount,
          });
        }
      }
    }
  }

  return chunks;
}

/**
 * Split text by token count with overlap
 *
 * Used when a section exceeds MAX_TOKENS. Splits on word boundaries
 * to avoid breaking mid-word, and maintains overlap for context.
 *
 * @param text - Text to split
 * @param maxTokens - Maximum tokens per chunk
 * @param overlap - Number of overlapping tokens between chunks
 * @returns Array of text chunks
 */
function chunkByTokens(
  text: string,
  maxTokens: number,
  overlap: number
): { text: string; tokenCount: number }[] {
  const words = text.split(/\s+/);
  const chunks: { text: string; tokenCount: number }[] = [];
  let currentWords: string[] = [];
  let currentTokens = 0;

  for (const word of words) {
    const wordTokens = encode(word).length;

    // Check if adding this word would exceed the limit
    if (currentTokens + wordTokens > maxTokens && currentWords.length > 0) {
      // Finalize current chunk
      const chunkText = currentWords.join(' ');
      chunks.push({
        text: chunkText,
        tokenCount: encode(chunkText).length,
      });

      // Start new chunk with overlap
      // Estimate ~4 characters per token to get word count for overlap
      const overlapWordCount = Math.ceil(overlap / 4);
      currentWords = currentWords.slice(-overlapWordCount);
      currentTokens = encode(currentWords.join(' ')).length;
    }

    currentWords.push(word);
    currentTokens += wordTokens;
  }

  // Don't forget the last chunk
  if (currentWords.length > 0) {
    const chunkText = currentWords.join(' ');
    chunks.push({
      text: chunkText,
      tokenCount: encode(chunkText).length,
    });
  }

  return chunks;
}

/**
 * Count tokens in text
 * Useful for external validation and debugging.
 *
 * @param text - Text to count tokens for
 * @returns Token count
 */
export function countTokens(text: string): number {
  return encode(text).length;
}
