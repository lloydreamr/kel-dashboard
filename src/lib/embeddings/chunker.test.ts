/**
 * Chunker Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { chunkMarkdown, countTokens, type TextChunk } from './chunker';

describe('countTokens', () => {
  it('counts tokens accurately for simple text', () => {
    // "hello world" is typically 2 tokens
    const count = countTokens('hello world');
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);
  });

  it('handles empty strings', () => {
    expect(countTokens('')).toBe(0);
  });

  it('handles longer text', () => {
    const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
    const count = countTokens(longText);
    expect(count).toBeGreaterThan(50);
  });
});

describe('chunkMarkdown', () => {
  it('returns empty array for empty input', () => {
    expect(chunkMarkdown('')).toEqual([]);
    expect(chunkMarkdown('   ')).toEqual([]);
  });

  it('creates single chunk for short content', () => {
    const markdown = `## Introduction

This is a short document about Philippine snack market research.
It contains just a few paragraphs of content that should fit in one chunk.
`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBe(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('Introduction');
  });

  it('splits by H2 headings', () => {
    const markdown = `## Section One

This is the first section with some content about competitors.
It discusses market positioning and pricing strategies in detail.
We look at various approaches and methodologies used.

## Section Two

This is the second section about distribution channels.
We analyze various retail and wholesale options available.
This includes supermarkets, convenience stores, and sari-sari stores.

## Section Three

This section covers consumer preferences and behaviors in detail.
We examine purchasing patterns and brand loyalty factors.
The analysis includes demographic breakdowns and trends.
`;

    const chunks = chunkMarkdown(markdown);

    // Should have 3 chunks (one per section) - each now has enough tokens
    expect(chunks.length).toBe(3);
    expect(chunks[0].text).toContain('Section One');
    expect(chunks[1].text).toContain('Section Two');
    expect(chunks[2].text).toContain('Section Three');
  });

  it('assigns sequential indices', () => {
    const markdown = `## First

Content one.

## Second

Content two.

## Third

Content three with more words to make it substantial enough.
`;

    const chunks = chunkMarkdown(markdown);

    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
    });
  });

  it('includes token count for each chunk', () => {
    const markdown = `## Analysis

This section contains analysis of the market conditions and trends.
We look at growth rates, competition, and consumer behavior patterns.
`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(typeof chunk.tokenCount).toBe('number');
    });
  });

  it('skips very short sections', () => {
    const markdown = `## A

.

## Real Section

This is a real section with enough content to be meaningful.
It discusses market research findings in detail.
`;

    const chunks = chunkMarkdown(markdown);

    // Only the real section should be included
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain('Real Section');
  });

  it('subdivides very long sections with overlap', () => {
    // Create a very long section that exceeds MAX_TOKENS (800)
    const longContent = 'This is a sentence about market research. '.repeat(200);
    const markdown = `## Long Section

${longContent}
`;

    const chunks = chunkMarkdown(markdown);

    // Should be split into multiple chunks
    expect(chunks.length).toBeGreaterThan(1);

    // Each chunk should be under the token limit
    chunks.forEach(chunk => {
      expect(chunk.tokenCount).toBeLessThanOrEqual(850); // Allow small margin
    });

    // Chunks should have sequential indices
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
    });
  });

  it('handles content without H2 headings', () => {
    const markdown = `This is a document without any headings.
It just contains regular paragraph text.
There should still be chunking logic applied.`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].text).toContain('document without any headings');
  });

  it('preserves heading text in chunks', () => {
    const markdown = `## URC Company Profile

Universal Robina Corporation is a major player in Philippine snacks.
Founded in 1954, they have grown to dominate several categories.
`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain('## URC Company Profile');
    expect(chunks[0].text).toContain('Universal Robina Corporation');
  });
});

describe('chunkMarkdown edge cases', () => {
  it('handles markdown with code blocks', () => {
    const markdown = `## Technical Details

Here is some code:

\`\`\`typescript
const example = "test";
console.log(example);
\`\`\`

And more text after the code block.
`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('```typescript');
  });

  it('handles markdown with lists', () => {
    const markdown = `## Product Features

Key features include:
- Feature one with description
- Feature two with description
- Feature three with description
- Feature four with description

Each feature provides unique value.
`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain('- Feature one');
  });

  it('handles markdown with tables', () => {
    const markdown = `## Price Comparison

| Product | Price | Category |
|---------|-------|----------|
| Item A  | 25    | Snacks   |
| Item B  | 30    | Snacks   |

Table shows competitor pricing data.
`;

    const chunks = chunkMarkdown(markdown);

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain('Price Comparison');
    expect(chunks[0].text).toContain('Item A');
  });

  it('handles mixed heading levels', () => {
    const markdown = `# Main Title

Introduction paragraph with enough content to be meaningful and substantial.
This includes background information and context for the entire document.

## Section One

First section content with detailed information about the topic at hand.
We explore various aspects and considerations in depth here.

### Subsection

Subsection content goes here with more detail and specifics.
Additional analysis and supporting information is provided.

## Section Two

Second section with its own substantial content here for analysis.
This covers different aspects of the topic with thorough examination.
`;

    const chunks = chunkMarkdown(markdown);

    // Should split by H2, not H1 or H3
    // First chunk will have H1 + intro (before first ##)
    // Second chunk will have ## Section One + ### Subsection
    // Third chunk will have ## Section Two
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});
