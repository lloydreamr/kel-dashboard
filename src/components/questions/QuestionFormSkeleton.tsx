/**
 * Loading skeleton for the question form.
 * Matches the form layout with animated placeholders.
 */
export function QuestionFormSkeleton() {
  return (
    <div className="space-y-4" data-testid="question-form-skeleton">
      {/* Title field skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
      </div>

      {/* Description field skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
      </div>

      {/* Category field skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
      </div>

      {/* Buttons skeleton */}
      <div className="flex justify-end gap-3 pt-2">
        <div className="h-12 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-12 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
