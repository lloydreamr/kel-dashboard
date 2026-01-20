'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Callback for retry button. If not provided, retry button is hidden. */
  onRetry?: () => void;
}

/**
 * Reusable error state component for data fetch failures.
 * Displays error message with optional retry button.
 *
 * Story 9.8 (AC #5): Consistent error handling across list pages.
 */
export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      role="alert"
      className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center"
    >
      <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
      <p className="mt-2 text-destructive">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-4 min-h-12"
          data-testid="error-retry-button"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
