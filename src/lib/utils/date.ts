/**
 * Date Utilities
 *
 * Helper functions for date formatting and manipulation.
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 *
 * Handles edge cases:
 * - Invalid dates: Returns "Unknown"
 * - Future dates: Returns "Just now" (graceful fallback)
 * - Very old dates (>30 days): Returns absolute date
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Handle invalid dates
  if (isNaN(d.getTime())) {
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // Handle future dates gracefully
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Very old dates (>30 days) - show absolute date
  if (diffDays > 30) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffMins > 0) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  }
  return 'Just now';
}
