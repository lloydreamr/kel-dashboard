'use client';

/**
 * DashboardQuickStats Component
 *
 * Displays key metrics on the dashboard home page:
 * - Total questions count
 * - Pending decisions (awaiting Kel)
 * - Research progress percentage
 */

import { FileQuestion, Clock, TrendingUp } from 'lucide-react';

import { useQuestions } from '@/hooks/questions';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  testId: string;
  subtext?: string;
}

function StatCard({ label, value, icon, testId, subtext }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 text-center"
    >
      <div className="text-muted-foreground">{icon}</div>
      <div
        data-testid={`${testId}-value`}
        className="text-2xl font-bold text-foreground"
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {subtext && (
        <div
          data-testid={`${testId}-subtext`}
          className="text-xs text-muted-foreground"
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 animate-pulse">
      <div className="h-6 w-6 rounded bg-muted" />
      <div className="h-8 w-12 rounded bg-muted" />
      <div className="h-4 w-20 rounded bg-muted" />
    </div>
  );
}

export function DashboardQuickStats() {
  const { data: questions, isLoading } = useQuestions();

  if (isLoading) {
    return (
      <div
        data-testid="dashboard-quick-stats-loading"
        className="grid grid-cols-3 gap-4"
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const totalQuestions = questions?.length ?? 0;
  const pendingForKel =
    questions?.filter((q) => q.status === 'ready_for_kel').length ?? 0;
  const approvedCount =
    questions?.filter((q) => q.status === 'approved').length ?? 0;

  // Progress: percentage of questions that have reached a decision (approved or exploring_alternatives)
  const decidedCount =
    questions?.filter(
      (q) => q.status === 'approved' || q.status === 'exploring_alternatives'
    ).length ?? 0;
  const progressPercent =
    totalQuestions > 0 ? Math.round((decidedCount / totalQuestions) * 100) : 0;

  return (
    <div
      data-testid="dashboard-quick-stats"
      className="grid grid-cols-3 gap-4"
    >
      <StatCard
        testId="stat-total-questions"
        label="Questions"
        value={totalQuestions}
        icon={<FileQuestion className="h-6 w-6" />}
        subtext={approvedCount > 0 ? `${approvedCount} approved` : undefined}
      />
      <StatCard
        testId="stat-pending-decisions"
        label="Pending"
        value={pendingForKel}
        icon={<Clock className="h-6 w-6" />}
        subtext="awaiting Kel"
      />
      <StatCard
        testId="stat-progress"
        label="Progress"
        value={`${progressPercent}%`}
        icon={<TrendingUp className="h-6 w-6" />}
        subtext={`${decidedCount}/${totalQuestions} decided`}
      />
    </div>
  );
}
