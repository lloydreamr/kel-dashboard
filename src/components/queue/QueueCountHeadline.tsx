/**
 * QueueCountHeadline Component
 *
 * Displays the pending decision count with anti-guilt language.
 * Shows "10+ items" for counts > 10 (anti-overwhelm pattern).
 */

interface QueueCountHeadlineProps {
  count: number;
}

/**
 * Format the count for display.
 * Caps at "10+" to avoid overwhelming the user.
 */
function formatCount(count: number): string {
  if (count > 10) {
    return '10+';
  }
  return String(count);
}

export function QueueCountHeadline({ count }: QueueCountHeadlineProps) {
  const displayCount = formatCount(count);
  const itemLabel = count === 1 ? 'item' : 'items';

  return (
    <h1
      data-testid="queue-count-headline"
      className="text-2xl font-semibold text-foreground"
    >
      {displayCount} {itemLabel} ready for you
    </h1>
  );
}
