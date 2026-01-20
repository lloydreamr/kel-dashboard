'use client';

import { CountdownBanner } from '@/components/progress/CountdownBanner';
import { CountdownBannerSkeleton } from '@/components/progress/CountdownBannerSkeleton';
import { MilestoneCard } from '@/components/progress/MilestoneCard';
import { MilestoneCardSkeleton } from '@/components/progress/MilestoneCardSkeleton';
import { useMilestones } from '@/hooks/milestones';

export function ProgressPageClient() {
  const { data: milestones, isLoading, error } = useMilestones();

  if (isLoading) {
    return (
      <div data-testid="progress-loading-skeleton" className="space-y-6">
        <CountdownBannerSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MilestoneCardSkeleton />
          <MilestoneCardSkeleton />
          <MilestoneCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="progress-error" className="text-center py-8">
        <p className="text-destructive">Failed to load milestones. Please try again.</p>
      </div>
    );
  }

  return (
    <div data-testid="progress-page" className="space-y-6">
      <CountdownBanner />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {milestones?.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </div>
  );
}
