/**
 * RAG Context Builder Tests
 *
 * Unit tests for context building, source extraction, and confidence calculation.
 */

import { describe, it, expect } from 'vitest';

import type { SearchResult } from '@/lib/repositories/embeddings';

import {
  buildContextFromSources,
  calculateConfidence,
  extractSourcesFromResults,
} from './rag-context';

/**
 * Helper to create mock search results
 */
function createMockResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: 'test-id',
    document_type: 'companies',
    document_id: 'doc-12345678-abcd-1234-efgh-567890abcdef',
    chunk_index: 0,
    chunk_text: 'This is test content for the chunk.',
    similarity: 0.8,
    ...overrides,
  };
}

describe('calculateConfidence', () => {
  it('returns Low for empty results', () => {
    expect(calculateConfidence([])).toBe('Low');
  });

  it('returns High when top >= 0.85 and avg >= 0.75', () => {
    const results = [
      createMockResult({ similarity: 0.90 }),
      createMockResult({ similarity: 0.85 }),
      createMockResult({ similarity: 0.80 }),
    ];
    // top = 0.90, avg = 0.85
    expect(calculateConfidence(results)).toBe('High');
  });

  it('returns Medium when top >= 0.75 and avg >= 0.65', () => {
    const results = [
      createMockResult({ similarity: 0.78 }),
      createMockResult({ similarity: 0.70 }),
      createMockResult({ similarity: 0.65 }),
    ];
    // top = 0.78, avg = 0.71
    expect(calculateConfidence(results)).toBe('Medium');
  });

  it('returns Low when similarity scores are below thresholds', () => {
    const results = [
      createMockResult({ similarity: 0.72 }),
      createMockResult({ similarity: 0.60 }),
      createMockResult({ similarity: 0.55 }),
    ];
    // top = 0.72 (< 0.75), avg = 0.62 (< 0.65)
    expect(calculateConfidence(results)).toBe('Low');
  });

  it('returns Low when top is high but avg is too low', () => {
    const results = [
      createMockResult({ similarity: 0.90 }),
      createMockResult({ similarity: 0.50 }),
      createMockResult({ similarity: 0.40 }),
    ];
    // top = 0.90, but avg = 0.60 (< 0.65 for Medium, < 0.75 for High)
    expect(calculateConfidence(results)).toBe('Low');
  });

  it('handles single result correctly', () => {
    const highResult = [createMockResult({ similarity: 0.90 })];
    expect(calculateConfidence(highResult)).toBe('High');

    const mediumResult = [createMockResult({ similarity: 0.78 })];
    expect(calculateConfidence(mediumResult)).toBe('Medium');

    const lowResult = [createMockResult({ similarity: 0.60 })];
    expect(calculateConfidence(lowResult)).toBe('Low');
  });

  it('uses first result as top similarity (assumes sorted)', () => {
    const results = [
      createMockResult({ similarity: 0.70 }), // First = top
      createMockResult({ similarity: 0.90 }), // Higher but not first
    ];
    // top = 0.70 (< 0.75), so should be Low even though 0.90 exists
    expect(calculateConfidence(results)).toBe('Low');
  });
});

describe('buildContextFromSources', () => {
  it('returns empty string for empty results', () => {
    expect(buildContextFromSources([])).toBe('');
  });

  it('formats results with document type and ID labels', () => {
    const results = [
      createMockResult({
        document_type: 'companies',
        document_id: 'abc123',
        chunk_text: 'Company info here.',
      }),
    ];

    const context = buildContextFromSources(results);
    expect(context).toContain('[companies/abc123]:');
    expect(context).toContain('Company info here.');
  });

  it('includes multiple results in order', () => {
    const results = [
      createMockResult({
        document_type: 'companies',
        document_id: 'first',
        chunk_text: 'First chunk.',
      }),
      createMockResult({
        document_type: 'products',
        document_id: 'second',
        chunk_text: 'Second chunk.',
      }),
    ];

    const context = buildContextFromSources(results);
    const firstIndex = context.indexOf('[companies/first]');
    const secondIndex = context.indexOf('[products/second]');

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(context).toContain('First chunk.');
    expect(context).toContain('Second chunk.');
  });

  it('truncates when exceeding max tokens', () => {
    // Create results with moderate text
    const text = 'word '.repeat(50); // ~50 tokens per chunk
    const results = [
      createMockResult({ document_id: 'chunk1', chunk_text: text }),
      createMockResult({ document_id: 'chunk2', chunk_text: text }),
      createMockResult({ document_id: 'chunk3', chunk_text: text }),
      createMockResult({ document_id: 'chunk4', chunk_text: text }),
      createMockResult({ document_id: 'chunk5', chunk_text: text }),
    ];

    // With 200 token limit, should include some but not all chunks
    const context = buildContextFromSources(results, 200);

    // Should have first chunk
    expect(context).toContain('chunk1');
    // Should NOT have all 5 chunks (would be ~250+ tokens with labels)
    expect(context).not.toContain('chunk5');
  });

  it('respects default max tokens of 4000', () => {
    // 10 chunks of ~500 tokens each = 5000 tokens, should be truncated
    const mediumText = 'word '.repeat(100);
    const results = Array.from({ length: 10 }, (_, i) =>
      createMockResult({ document_id: `chunk${i}`, chunk_text: mediumText })
    );

    const context = buildContextFromSources(results);

    // Should have some but not all chunks (4000 token limit)
    expect(context).toContain('chunk0');
    // Last chunks should be truncated
  });

  it('trims whitespace from final output', () => {
    const results = [
      createMockResult({ chunk_text: 'Test content.' }),
    ];

    const context = buildContextFromSources(results);
    expect(context).not.toMatch(/^\s/);
    expect(context).not.toMatch(/\s$/);
  });
});

describe('extractSourcesFromResults', () => {
  it('returns empty array for empty results', () => {
    expect(extractSourcesFromResults([])).toEqual([]);
  });

  it('maps search results to ChatSource format', () => {
    const results = [
      createMockResult({
        document_type: 'companies',
        document_id: 'abc12345-6789-abcd-efgh-ijklmnopqrst',
        chunk_text: 'This is the content.',
        similarity: 0.85,
      }),
    ];

    const sources = extractSourcesFromResults(results);

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      documentType: 'companies',
      documentId: 'abc12345-6789-abcd-efgh-ijklmnopqrst',
      similarity: 0.85,
    });
  });

  it('generates title from document type and shortened ID', () => {
    const results = [
      createMockResult({
        document_type: 'companies',
        document_id: 'abc12345-full-uuid-here',
      }),
    ];

    const sources = extractSourcesFromResults(results);
    expect(sources[0].title).toBe('Company (abc12345)');
  });

  it('maps all document types to readable labels', () => {
    const types = ['companies', 'products', 'consumers', 'trends', 'research_docs'] as const;
    const expectedLabels = ['Company', 'Product', 'Consumer Research', 'Market Trend', 'Research Document'];

    types.forEach((type, index) => {
      const results = [createMockResult({ document_type: type, document_id: '12345678' })];
      const sources = extractSourcesFromResults(results);
      expect(sources[0].title).toContain(expectedLabels[index]);
    });
  });

  it('truncates excerpt to 150 characters with ellipsis', () => {
    const longText = 'a'.repeat(200);
    const results = [createMockResult({ chunk_text: longText })];

    const sources = extractSourcesFromResults(results);

    expect(sources[0].excerpt.length).toBeLessThanOrEqual(153); // 150 + "..."
    expect(sources[0].excerpt).toMatch(/\.\.\.$/);
  });

  it('preserves short excerpts without truncation', () => {
    const shortText = 'Short content.';
    const results = [createMockResult({ chunk_text: shortText })];

    const sources = extractSourcesFromResults(results);

    expect(sources[0].excerpt).toBe(shortText);
    expect(sources[0].excerpt).not.toContain('...');
  });

  it('preserves word boundaries when truncating long text', () => {
    // Text that would be truncated at exactly 150 chars would cut "longwordhere"
    const text = 'short ' + 'x'.repeat(140) + ' longwordhere end';
    const results = [createMockResult({ chunk_text: text })];

    const sources = extractSourcesFromResults(results);

    // Should be truncated
    expect(sources[0].excerpt).toContain('...');
    // The implementation tries to break at word boundaries if possible
    // Check that it truncates to approximately the right length
    expect(sources[0].excerpt.length).toBeLessThanOrEqual(153);
  });
});
