/**
 * Staleness Utilities
 *
 * Helper functions for detecting and displaying stale data warnings.
 * Data is considered stale when it's older than STALE_THRESHOLD_DAYS (14 days).
 */

/**
 * Default threshold for stale data (14 days = 2 weeks per FR42)
 */
export const STALE_THRESHOLD_DAYS = 14;

/**
 * Check if a date is stale (older than threshold days).
 *
 * Handles edge cases:
 * - null/undefined: Returns false (no date = not stale)
 * - Invalid date string: Returns false
 * - Exactly at threshold: Returns false (> not >=)
 */
export function isStale(
  dateStr: string | null | undefined,
  thresholdDays: number = STALE_THRESHOLD_DAYS
): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Note: exactly at threshold is NOT stale (> not >=)
  return diffDays > thresholdDays;
}

/**
 * Get the number of days since the date was last updated.
 *
 * Handles edge cases:
 * - null/undefined: Returns 0
 * - Invalid date string: Returns 0
 */
export function getStalenessDays(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get a human-readable message about data freshness.
 *
 * Returns messages like:
 * - "Updated today"
 * - "Updated yesterday"
 * - "Last updated X days ago. Consider verifying."
 * - "Unknown update time" (for null/undefined/invalid)
 */
export function getStalenessMessage(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown update time';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown update time';

  const days = getStalenessDays(dateStr);

  if (days < 1) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Last updated ${days} days ago. Consider verifying.`;
}
