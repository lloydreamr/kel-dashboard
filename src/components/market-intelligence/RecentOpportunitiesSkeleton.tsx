/**
 * RecentOpportunitiesSkeleton Component
 *
 * Loading skeleton for RecentOpportunities component.
 * Shows 3 placeholder items with animate-pulse.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RecentOpportunitiesSkeleton() {
  return (
    <Card data-testid="mi-recent-opportunities-skeleton" className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-6 w-36 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-5 w-24 rounded bg-muted" />
              </div>
              <div className="h-5 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
