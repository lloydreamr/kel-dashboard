/**
 * StatCardSkeleton Component
 *
 * Loading skeleton for StatCard component.
 * Uses animate-pulse and bg-muted per project patterns.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StatCardSkeleton() {
  return (
    <Card data-testid="mi-stat-card-skeleton" className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-5 w-5 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted mt-2" />
      </CardContent>
    </Card>
  );
}
