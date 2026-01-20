/**
 * Embeddings Module
 *
 * Barrel export for all embedding-related utilities.
 *
 * ⚠️ Note: openai.ts and generateEmbeddings.ts are SERVER-SIDE ONLY.
 * Only import those in API routes or scripts, never in client components.
 *
 * Safe for client-side:
 * - chunker (pure functions)
 * - contentExtractor (pure functions)
 */

// Chunking utilities (safe for client)
export { chunkMarkdown, countTokens, type TextChunk } from './chunker';

// Content extraction (safe for client)
export {
  extractCompanyContent,
  extractProductContent,
  extractConsumerContent,
  extractTrendContent,
  extractResearchDocContent,
} from './contentExtractor';

// Server-side only exports
// These will be imported directly when needed to avoid bundling in client code
// export * from './openai';
// export * from './generateEmbeddings';
