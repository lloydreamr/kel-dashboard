/**
 * Tests for exponential backoff utility.
 *
 * @see Story 8.3: Sync Engine - Task 2
 */

import { describe, expect, it, vi } from 'vitest';

import { calculateBackoffDelay, calculateBackoffDelayWithoutJitter } from './backoff';
import { SYNC_CONFIG } from './types';

describe('calculateBackoffDelay', () => {
  it('returns delay within expected range for retryCount=0', () => {
    const delay = calculateBackoffDelay(0);
    // Base delay (1000) + jitter (0-1000) = 1000-2000
    expect(delay).toBeGreaterThanOrEqual(SYNC_CONFIG.BASE_DELAY_MS);
    expect(delay).toBeLessThanOrEqual(
      SYNC_CONFIG.BASE_DELAY_MS + SYNC_CONFIG.JITTER_MS
    );
  });

  it('doubles delay with each retry', () => {
    // Use deterministic version to verify exponential growth
    const delay0 = calculateBackoffDelayWithoutJitter(0);
    const delay1 = calculateBackoffDelayWithoutJitter(1);
    const delay2 = calculateBackoffDelayWithoutJitter(2);

    expect(delay0).toBe(1000); // 1000 * 2^0 = 1000
    expect(delay1).toBe(2000); // 1000 * 2^1 = 2000
    expect(delay2).toBe(4000); // 1000 * 2^2 = 4000
  });

  it('caps delay at MAX_DELAY_MS', () => {
    // retryCount=10 would give 1000 * 2^10 = 1,024,000ms
    // but should be capped at 30,000ms
    const delay = calculateBackoffDelayWithoutJitter(10);
    expect(delay).toBe(SYNC_CONFIG.MAX_DELAY_MS);
  });

  it('includes random jitter', () => {
    // Run multiple times to verify jitter adds variance
    const delays = Array.from({ length: 10 }, () => calculateBackoffDelay(0));
    const uniqueDelays = new Set(delays);

    // With 10 samples and 1000ms jitter range, we should have variance
    // (extremely unlikely to get same value 10 times)
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('accepts custom baseDelay and maxDelay', () => {
    const customBase = 500;
    const customMax = 5000;

    const delay = calculateBackoffDelayWithoutJitter(0, customBase, customMax);
    expect(delay).toBe(customBase);

    const delayAtMax = calculateBackoffDelayWithoutJitter(10, customBase, customMax);
    expect(delayAtMax).toBe(customMax);
  });

  it('handles edge case of retryCount=0 without jitter', () => {
    const delay = calculateBackoffDelayWithoutJitter(0);
    expect(delay).toBe(SYNC_CONFIG.BASE_DELAY_MS);
  });
});

describe('calculateBackoffDelayWithoutJitter', () => {
  it('returns deterministic values', () => {
    const delay1 = calculateBackoffDelayWithoutJitter(1);
    const delay2 = calculateBackoffDelayWithoutJitter(1);
    expect(delay1).toBe(delay2);
  });

  it('follows exponential formula without jitter', () => {
    const results = [0, 1, 2, 3, 4].map((n) =>
      calculateBackoffDelayWithoutJitter(n)
    );
    expect(results).toEqual([1000, 2000, 4000, 8000, 16000]);
  });

  it('respects maxDelay cap', () => {
    const delay = calculateBackoffDelayWithoutJitter(100);
    expect(delay).toBe(SYNC_CONFIG.MAX_DELAY_MS);
  });
});
