import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function MilestoneCardSkeleton() {
  return (
    <Card data-testid="milestone-card-skeleton" className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-32 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-6 w-24 rounded-full bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-8 w-16 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
