'use client';

/**
 * TypingIndicator Component
 *
 * Animated dots showing AI is processing/streaming a response.
 * Uses CSS keyframe animation for the bouncing effect.
 *
 * Story 15.3: Ask AI Chat Interface
 */

import { cn } from '@/lib/utils';

export type TypingIndicatorProps = {
  /** Additional CSS classes */
  className?: string;
};

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      data-testid="typing-indicator"
      className={cn('flex justify-start', className)}
    >
      <div className="bg-card border border-border rounded-lg p-3 flex gap-1">
        <span
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
