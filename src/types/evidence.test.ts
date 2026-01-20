import { describe, expect, it } from 'vitest';

import {
  isValidEvidenceUrl,
  extractDomain,
  buildUrlWithAnchor,
} from './evidence';

describe('isValidEvidenceUrl', () => {
  it('accepts https URLs', () => {
    expect(isValidEvidenceUrl('https://example.com')).toBe(true);
    expect(isValidEvidenceUrl('https://example.com/path')).toBe(true);
    expect(isValidEvidenceUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('accepts http URLs', () => {
    expect(isValidEvidenceUrl('http://example.com')).toBe(true);
  });

  it('rejects javascript: protocol', () => {
    expect(isValidEvidenceUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: protocol', () => {
    expect(isValidEvidenceUrl('data:text/html,<script>alert(1)</script>')).toBe(
      false
    );
  });

  it('rejects invalid URLs', () => {
    expect(isValidEvidenceUrl('not a url')).toBe(false);
    expect(isValidEvidenceUrl('')).toBe(false);
    expect(isValidEvidenceUrl('example.com')).toBe(false);
  });
});

describe('extractDomain', () => {
  it('extracts domain from URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('removes www prefix', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('returns original string for invalid URL', () => {
    expect(extractDomain('not a url')).toBe('not a url');
  });
});

describe('buildUrlWithAnchor', () => {
  it('appends anchor to URL', () => {
    expect(buildUrlWithAnchor('https://example.com', 'section')).toBe(
      'https://example.com#section'
    );
  });

  it('handles anchor with # prefix', () => {
    expect(buildUrlWithAnchor('https://example.com', '#section')).toBe(
      'https://example.com#section'
    );
  });

  it('returns base URL when no anchor', () => {
    expect(buildUrlWithAnchor('https://example.com', null)).toBe(
      'https://example.com'
    );
    expect(buildUrlWithAnchor('https://example.com', undefined)).toBe(
      'https://example.com'
    );
    expect(buildUrlWithAnchor('https://example.com', '')).toBe(
      'https://example.com'
    );
  });
});
