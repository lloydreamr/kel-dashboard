/**
 * Unit tests for staleness utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  isStale,
  getStalenessDays,
  getStalenessMessage,
  STALE_THRESHOLD_DAYS,
} from './staleness';

describe('staleness utilities', () => {
  // Mock current date for consistent tests
  const mockNow = new Date('2025-12-29T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('STALE_THRESHOLD_DAYS', () => {
    it('should be 14 days (2 weeks per FR42)', () => {
      expect(STALE_THRESHOLD_DAYS).toBe(14);
    });
  });

  describe('isStale', () => {
    it('returns false for data updated today', () => {
      expect(isStale(new Date().toISOString())).toBe(false);
    });

    it('returns false for data updated 1 day ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 1);
      expect(isStale(date.toISOString())).toBe(false);
    });

    it('returns false for data updated 13 days ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 13);
      expect(isStale(date.toISOString())).toBe(false);
    });

    // CRITICAL: Boundary test - exactly 14 days is NOT stale (> not >=)
    it('returns false for data updated exactly 14 days ago (boundary)', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 14);
      expect(isStale(date.toISOString())).toBe(false);
    });

    it('returns true for data updated 15 days ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 15);
      expect(isStale(date.toISOString())).toBe(true);
    });

    it('returns true for data updated 30 days ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 30);
      expect(isStale(date.toISOString())).toBe(true);
    });

    it('respects custom threshold', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 5);
      // 5 days old, threshold is 3, should be stale
      expect(isStale(date.toISOString(), 3)).toBe(true);
    });

    it('respects custom threshold at boundary', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 3);
      // Exactly at threshold, should NOT be stale (> not >=)
      expect(isStale(date.toISOString(), 3)).toBe(false);
    });

    // Edge cases - null/undefined/invalid handling
    it('returns false for null date', () => {
      expect(isStale(null)).toBe(false);
    });

    it('returns false for undefined date', () => {
      expect(isStale(undefined)).toBe(false);
    });

    it('returns false for invalid date string', () => {
      expect(isStale('invalid-date')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isStale('')).toBe(false);
    });
  });

  describe('getStalenessDays', () => {
    it('returns 0 for data updated today', () => {
      expect(getStalenessDays(new Date().toISOString())).toBe(0);
    });

    it('returns 1 for data updated 1 day ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 1);
      expect(getStalenessDays(date.toISOString())).toBe(1);
    });

    it('returns 15 for data updated 15 days ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 15);
      expect(getStalenessDays(date.toISOString())).toBe(15);
    });

    it('returns 0 for null date', () => {
      expect(getStalenessDays(null)).toBe(0);
    });

    it('returns 0 for undefined date', () => {
      expect(getStalenessDays(undefined)).toBe(0);
    });

    it('returns 0 for invalid date string', () => {
      expect(getStalenessDays('invalid-date')).toBe(0);
    });
  });

  describe('getStalenessMessage', () => {
    it('returns verification message for stale data (20 days)', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 20);
      expect(getStalenessMessage(date.toISOString())).toBe(
        'Last updated 20 days ago. Consider verifying.'
      );
    });

    it('returns verification message for stale data (15 days)', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 15);
      expect(getStalenessMessage(date.toISOString())).toBe(
        'Last updated 15 days ago. Consider verifying.'
      );
    });

    it('returns "Updated today" for same-day date', () => {
      expect(getStalenessMessage(new Date().toISOString())).toBe('Updated today');
    });

    it('returns "Updated yesterday" for 1-day-old date', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 1);
      expect(getStalenessMessage(date.toISOString())).toBe('Updated yesterday');
    });

    it('returns "Unknown update time" for null', () => {
      expect(getStalenessMessage(null)).toBe('Unknown update time');
    });

    it('returns "Unknown update time" for undefined', () => {
      expect(getStalenessMessage(undefined)).toBe('Unknown update time');
    });

    it('returns "Unknown update time" for invalid date string', () => {
      expect(getStalenessMessage('invalid-date')).toBe('Unknown update time');
    });

    it('returns regular message for 5 days ago', () => {
      const date = new Date(mockNow);
      date.setDate(date.getDate() - 5);
      expect(getStalenessMessage(date.toISOString())).toBe(
        'Last updated 5 days ago. Consider verifying.'
      );
    });
  });
});
