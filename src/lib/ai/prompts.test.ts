/**
 * AI System Prompts Tests
 *
 * Unit tests for system prompt building and formatting.
 */

import { describe, it, expect } from 'vitest';

import type { ChatSource } from './types';

import { buildSystemPrompt, NO_CONTEXT_PROMPT } from './prompts';

/**
 * Helper to create mock ChatSource
 */
function createMockSource(overrides: Partial<ChatSource> = {}): ChatSource {
  return {
    documentType: 'companies',
    documentId: 'test-doc-id',
    title: 'Company (test1234)',
    excerpt: 'Test excerpt content.',
    similarity: 0.8,
    ...overrides,
  };
}

describe('buildSystemPrompt', () => {
  it('includes sources list in the prompt', () => {
    const sources = [
      createMockSource({
        documentType: 'companies',
        documentId: 'abc123',
        title: 'Company (abc12345)',
      }),
    ];
    const context = 'Some context here.';

    const prompt = buildSystemPrompt(sources, context);

    expect(prompt).toContain('[companies/abc123]: Company (abc12345)');
  });

  it('includes context in the prompt', () => {
    const sources = [createMockSource()];
    const context = 'This is the retrieved context from the knowledge base.';

    const prompt = buildSystemPrompt(sources, context);

    expect(prompt).toContain(context);
    expect(prompt).toContain('CONTEXT FROM KNOWLEDGE BASE:');
  });

  it('formats multiple sources as a list', () => {
    const sources = [
      createMockSource({
        documentType: 'companies',
        documentId: 'company1',
        title: 'Company A',
      }),
      createMockSource({
        documentType: 'products',
        documentId: 'product1',
        title: 'Product B',
      }),
    ];

    const prompt = buildSystemPrompt(sources, 'context');

    expect(prompt).toContain('- [companies/company1]: Company A');
    expect(prompt).toContain('- [products/product1]: Product B');
  });

  it('includes citation instructions', () => {
    const prompt = buildSystemPrompt([createMockSource()], 'context');

    expect(prompt).toContain('[Source: document_type/document_id]');
    expect(prompt).toContain('Always cite your sources');
  });

  it('includes market intelligence context', () => {
    const prompt = buildSystemPrompt([createMockSource()], 'context');

    expect(prompt).toContain('Philippine snack market');
    expect(prompt).toContain('market intelligence');
  });

  it('handles empty sources with appropriate message', () => {
    const prompt = buildSystemPrompt([], 'some context');

    expect(prompt).toContain('No relevant sources found');
  });

  it('includes rules for factual responses', () => {
    const prompt = buildSystemPrompt([createMockSource()], 'context');

    expect(prompt).toContain('Stay factual');
    expect(prompt).toContain('do not speculate');
    expect(prompt).toContain('Be concise but thorough');
  });

  it('instructs to acknowledge limitations', () => {
    const prompt = buildSystemPrompt([createMockSource()], 'context');

    expect(prompt).toContain("context doesn't contain enough information");
    expect(prompt).toContain('Based on available data');
  });
});

describe('NO_CONTEXT_PROMPT', () => {
  it('is defined as a string', () => {
    expect(typeof NO_CONTEXT_PROMPT).toBe('string');
    expect(NO_CONTEXT_PROMPT.length).toBeGreaterThan(0);
  });

  it('mentions Philippine snack market context', () => {
    expect(NO_CONTEXT_PROMPT).toContain('Philippine snack market');
  });

  it('instructs to acknowledge lack of data', () => {
    expect(NO_CONTEXT_PROMPT).toContain("don't have specific data");
  });

  it('describes available knowledge base content', () => {
    expect(NO_CONTEXT_PROMPT).toContain('companies');
    expect(NO_CONTEXT_PROMPT).toContain('products');
    expect(NO_CONTEXT_PROMPT).toContain('consumer');
    expect(NO_CONTEXT_PROMPT).toContain('trends');
  });

  it('instructs not to make up information', () => {
    expect(NO_CONTEXT_PROMPT).toContain('DO NOT make up information');
  });

  it('suggests rephrasing the question', () => {
    expect(NO_CONTEXT_PROMPT).toContain('rephrase');
  });
});
