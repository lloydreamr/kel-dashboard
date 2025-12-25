import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { formatRelativeTime } from './date';

// Mock date to get consistent output
const mockNow = new Date('2025-12-23T12:00:00Z');

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for dates less than a minute ago', () => {
    const date = new Date('2025-12-23T11:59:50Z'); // 10 seconds ago
    expect(formatRelativeTime(date)).toBe('Just now');
  });

  it('returns "1 minute ago" for exactly 1 minute ago', () => {
    const date = new Date('2025-12-23T11:59:00Z'); // 1 minute ago
    expect(formatRelativeTime(date)).toBe('1 minute ago');
  });

  it('returns "X minutes ago" for multiple minutes', () => {
    const date = new Date('2025-12-23T11:30:00Z'); // 30 minutes ago
    expect(formatRelativeTime(date)).toBe('30 minutes ago');
  });

  it('returns "1 hour ago" for exactly 1 hour ago', () => {
    const date = new Date('2025-12-23T11:00:00Z'); // 1 hour ago
    expect(formatRelativeTime(date)).toBe('1 hour ago');
  });

  it('returns "X hours ago" for multiple hours', () => {
    const date = new Date('2025-12-23T07:00:00Z'); // 5 hours ago
    expect(formatRelativeTime(date)).toBe('5 hours ago');
  });

  it('returns "1 day ago" for exactly 1 day ago', () => {
    const date = new Date('2025-12-22T12:00:00Z'); // 1 day ago
    expect(formatRelativeTime(date)).toBe('1 day ago');
  });

  it('returns "X days ago" for multiple days', () => {
    const date = new Date('2025-12-20T12:00:00Z'); // 3 days ago
    expect(formatRelativeTime(date)).toBe('3 days ago');
  });

  it('accepts string dates', () => {
    expect(formatRelativeTime('2025-12-23T10:00:00Z')).toBe('2 hours ago');
  });

  it('accepts Date objects', () => {
    const date = new Date('2025-12-23T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('2 hours ago');
  });

  describe('edge cases', () => {
    it('returns "Unknown" for invalid date strings', () => {
      expect(formatRelativeTime('invalid-date')).toBe('Unknown');
    });

    it('returns "Unknown" for empty string', () => {
      expect(formatRelativeTime('')).toBe('Unknown');
    });

    it('returns "Just now" for future dates (graceful fallback)', () => {
      const futureDate = new Date('2025-12-24T12:00:00Z'); // 1 day in future
      expect(formatRelativeTime(futureDate)).toBe('Just now');
    });

    it('returns absolute date for dates older than 30 days (same year)', () => {
      const oldDate = new Date('2025-11-01T12:00:00Z'); // 52 days ago
      const result = formatRelativeTime(oldDate);
      expect(result).toBe('Nov 1');
    });

    it('returns absolute date with year for dates older than 30 days (different year)', () => {
      const oldDate = new Date('2024-06-15T12:00:00Z'); // ~18 months ago
      const result = formatRelativeTime(oldDate);
      expect(result).toBe('Jun 15, 2024');
    });

    it('returns days for dates exactly 30 days ago', () => {
      const thirtyDaysAgo = new Date('2025-11-23T12:00:00Z'); // exactly 30 days
      expect(formatRelativeTime(thirtyDaysAgo)).toBe('30 days ago');
    });
  });
});
