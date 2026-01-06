'use client';

import { BarChart3, Package, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMilestoneProgress } from '@/hooks/milestones';
import { useStaleQuestionsByCategory } from '@/hooks/questions';
import { CATEGORY_LABELS } from '@/types/question';

import { ClarityMeter } from './ClarityMeter';
import { CompletionBadge } from './CompletionBadge';
import { FreshnessOkIndicator } from './FreshnessOkIndicator';
import { FreshnessWarningBadge } from './FreshnessWarningBadge';
import { MarkCompleteButton } from './MarkCompleteButton';
import { MilestoneCardSkeleton } from './MilestoneCardSkeleton';
import { MilestoneNotes } from './MilestoneNotes';

import type { Milestone } from '@/types';
import type { QuestionCategory } from '@/types/question';

interface MilestoneCardProps {
  milestone: Milestone;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  market: <BarChart3 className="h-5 w-5" />,
  product: <Package className="h-5 w-5" />,
  distribution: <Truck className="h-5 w-5" />,
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
  const router = useRouter();
  const { data: progress, isLoading } = useMilestoneProgress(milestone.category);
  const { data: stalenessData } = useStaleQuestionsByCategory(
    milestone.category as QuestionCategory
  );

  const handleFreshnessBadgeClick = () => {
    router.push(`/questions/stale/${milestone.category}`);
  };

  if (isLoading) {
    return <MilestoneCardSkeleton />;
  }

  return (
    <Card data-testid={`milestone-card-${milestone.category}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {CATEGORY_ICONS[milestone.category]}
          {CATEGORY_LABELS[milestone.category as QuestionCategory]}
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

        {/* Freshness Indicator Section */}
        <div className="mt-4">
          <FreshnessWarningBadge
            staleCount={stalenessData?.staleCount ?? 0}
            category={milestone.category as QuestionCategory}
            onClick={handleFreshnessBadgeClick}
          />
          <FreshnessOkIndicator staleCount={stalenessData?.staleCount ?? 0} />
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
