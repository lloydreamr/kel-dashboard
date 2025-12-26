'use client';

interface CompletionBadgeProps {
  completedAt: string | null;
}

/**
 * Displays a "✓ Complete" badge with the completion date.
 * Uses native Intl.DateTimeFormat for date formatting (no external libraries).
 */
export function CompletionBadge({ completedAt }: CompletionBadgeProps) {
  if (!completedAt) return null;

  // Validate and parse date
  const date = new Date(completedAt);
  if (isNaN(date.getTime())) {
    console.warn('CompletionBadge: Invalid date provided:', completedAt);
    return null;
  }

  // Format date using native Intl
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  return (
    <div
      data-testid="milestone-complete-badge"
      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1"
    >
      <span className="text-green-700 font-medium">✓ Complete</span>
      <span
        data-testid="milestone-complete-date"
        className="text-green-600 text-sm"
      >
        {formattedDate}
      </span>
    </div>
  );
}
