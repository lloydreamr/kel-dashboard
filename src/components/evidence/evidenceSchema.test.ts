import { describe, expect, it } from 'vitest';

import { createEvidenceSchema } from './evidenceSchema';

describe('createEvidenceSchema', () => {
  describe('title validation', () => {
    it('rejects empty title', () => {
      const result = createEvidenceSchema.safeParse({
        title: '',
        url: 'https://example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('rejects title over 200 characters', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'a'.repeat(201),
        url: 'https://example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Title must be under 200 characters'
        );
      }
    });

    it('accepts valid title', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Valid Source Title',
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('url validation', () => {
    it('rejects empty url', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects javascript: protocol', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'javascript:alert(1)',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Invalid URL. Must be http:// or https://'
        );
      }
    });

    it('rejects data: protocol', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'data:text/html,<script>alert(1)</script>',
      });
      expect(result.success).toBe(false);
    });

    it('accepts https URLs', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'https://example.com/path?query=1',
      });
      expect(result.success).toBe(true);
    });

    it('accepts http URLs', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'http://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects malformed URLs', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('transforms empty anchor to null', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'https://example.com',
        section_anchor: '  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.section_anchor).toBe(null);
      }
    });

    it('preserves valid anchor', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'https://example.com',
        section_anchor: '#pricing',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.section_anchor).toBe('#pricing');
      }
    });

    it('transforms empty excerpt to null', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'https://example.com',
        excerpt: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.excerpt).toBe(null);
      }
    });

    it('rejects excerpt over 500 characters', () => {
      const result = createEvidenceSchema.safeParse({
        title: 'Test',
        url: 'https://example.com',
        excerpt: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });
});
