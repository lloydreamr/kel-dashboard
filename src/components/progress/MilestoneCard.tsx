'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMilestoneProgress } from '@/hooks/milestones';

import { ClarityMeter } from './ClarityMeter';
import { CompletionBadge } from './CompletionBadge';
import { MarkCompleteButton } from './MarkCompleteButton';
import { MilestoneCardSkeleton } from './MilestoneCardSkeleton';
import { MilestoneNotes } from './MilestoneNotes';

import type { Milestone } from '@/types';

interface MilestoneCardProps {
  milestone: Milestone;
}

const CATEGORY_ICONS: Record<string, string> = {
  market: '📊',
  product: '📦',
  distribution: '🚚',
};

const CATEGORY_LABELS: Record<string, string> = {
  market: 'Market',
  product: 'Product',
  distribution: 'Distribution',
};

const STATUS_DISPLAY: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  not_started: { label: 'Not Started', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  complete: { label: 'Complete', variant: 'default' }, // Using default for green-ish complete state
};

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const { data: progress, isLoading } = useMilestoneProgress(milestone.category);

  if (isLoading) {
    return <MilestoneCardSkeleton />;
  }

  return (
    <Card data-testid={`milestone-card-${milestone.category}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {CATEGORY_ICONS[milestone.category]}
          {CATEGORY_LABELS[milestone.category]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {milestone.status === 'complete' ? (
          <CompletionBadge completedAt={milestone.completed_at} />
        ) : (
          <Badge
            data-testid="milestone-status-badge"
            variant={STATUS_DISPLAY[milestone.status].variant}
          >
            {STATUS_DISPLAY[milestone.status].label}
          </Badge>
        )}

        <div className="mt-4">
          <ClarityMeter progress={progress ?? null} isLoading={isLoading} />
        </div>

        <div className="mt-4">
          <MarkCompleteButton milestone={milestone} />
        </div>

        {/* Milestone Notes Section */}
        <MilestoneNotes milestoneId={milestone.id} />
      </CardContent>
    </Card>
  );
}
