import { QUESTION_CATEGORIES } from '@/types/question';

function CategorySkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 py-3 bg-muted">
        <div className="h-5 w-20 rounded bg-muted-foreground/20" />
        <div className="h-4 w-16 rounded bg-muted-foreground/20" />
      </div>
      <div className="bg-background p-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-md border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="mt-2 h-3 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuestionsListSkeleton() {
  return (
    <div data-testid="questions-list-skeleton" className="space-y-6">
      {QUESTION_CATEGORIES.map((category) => (
        <CategorySkeleton key={category} />
      ))}
    </div>
  );
}
