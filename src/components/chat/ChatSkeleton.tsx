/**
 * ChatSkeleton Component
 *
 * Loading skeleton for the chat interface.
 * Shows placeholder messages and input with shimmer animation.
 * Adapted from DetailPageSkeleton pattern.
 *
 * Story 15.3: Ask AI Chat Interface
 */

export function ChatSkeleton() {
  return (
    <div
      data-testid="chat-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading chat"
      className="flex flex-col h-[calc(100vh-var(--header-height))] animate-pulse"
    >
      {/* Messages area skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="bg-muted rounded-lg p-3 max-w-[70%]">
            <div className="h-4 w-48 rounded bg-muted-foreground/20" />
          </div>
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg p-3 max-w-[80%] space-y-2">
            <div className="h-4 w-64 rounded bg-muted-foreground/20" />
            <div className="h-4 w-56 rounded bg-muted-foreground/20" />
            <div className="h-4 w-40 rounded bg-muted-foreground/20" />
          </div>
        </div>

        {/* Another user message skeleton */}
        <div className="flex justify-end">
          <div className="bg-muted rounded-lg p-3 max-w-[70%]">
            <div className="h-4 w-32 rounded bg-muted-foreground/20" />
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 h-12 rounded-md bg-muted" />
          <div className="h-12 w-12 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
