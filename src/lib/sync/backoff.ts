/**
 * Exponential backoff utility for sync retry logic.
 * Internal module - not exported from barrel.
 *
 * Formula: min(baseDelay * 2^retryCount + jitter, maxDelay)
 *
 * @example
 * ```typescript
 * // retryCount=0: ~1000-2000ms (1s base + up to 1s jitter)
 * // retryCount=1: ~2000-3000ms (2s base + up to 1s jitter)
 * // retryCount=2: ~4000-5000ms (4s base + up to 1s jitter)
 * const delay = calculateBackoffDelay(retryCount);
 * ```
 *
 * @see Story 8.3: Sync Engine
 */

import { SYNC_CONFIG } from './types';

/**
 * Calculates the delay before the next retry attempt using exponential backoff.
 *
 * Uses the formula: min(baseDelay * 2^retryCount + jitter, maxDelay)
 * - Exponential growth prevents rapid retries
 * - Jitter prevents thundering herd when multiple clients retry simultaneously
 * - Max cap prevents unreasonably long waits
 *
 * @param retryCount - Number of previous retry attempts (0-indexed)
 * @param baseDelay - Base delay in ms (default from SYNC_CONFIG)
 * @param maxDelay - Maximum delay cap in ms (default from SYNC_CONFIG)
 * @returns Delay in milliseconds before next retry
 *
 * @example
 * ```typescript
 * const delay = calculateBackoffDelay(0); // ~1000-2000ms
 * const delay = calculateBackoffDelay(1); // ~2000-3000ms
 * const delay = calculateBackoffDelay(2); // ~4000-5000ms
 * ```
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelay: number = SYNC_CONFIG.BASE_DELAY_MS,
  maxDelay: number = SYNC_CONFIG.MAX_DELAY_MS
): number {
  // Exponential delay: baseDelay * 2^retryCount
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);

  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * SYNC_CONFIG.JITTER_MS;

  // Cap at maxDelay to prevent unreasonably long waits
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Calculates backoff delay without jitter.
 * Useful for testing where deterministic values are needed.
 *
 * @param retryCount - Number of previous retry attempts (0-indexed)
 * @param baseDelay - Base delay in ms (default from SYNC_CONFIG)
 * @param maxDelay - Maximum delay cap in ms (default from SYNC_CONFIG)
 * @returns Delay in milliseconds (without jitter)
 */
export function calculateBackoffDelayWithoutJitter(
  retryCount: number,
  baseDelay: number = SYNC_CONFIG.BASE_DELAY_MS,
  maxDelay: number = SYNC_CONFIG.MAX_DELAY_MS
): number {
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  return Math.min(exponentialDelay, maxDelay);
}
