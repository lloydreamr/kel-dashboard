/**
 * EmptyState Component
 *
 * Reusable empty state for lists and views with no data.
 * Displays an icon, message, and optional action.
 */

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Message to display below the icon */
  message: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Optional test ID for testing */
  testId?: string;
  /** Optional action element (e.g., button) */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  message,
  ariaLabel,
  testId,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-label={ariaLabel ?? message}
      className={cn(
        'rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center',
        className
      )}
    >
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="mt-2 text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
