'use client';

/**
 * QuestionCard Component
 *
 * Displays a question summary with status, stale badge, evidence count, and quick actions.
 * Quick actions menu visible only for Maho.
 */

import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { StaleDataBadge } from '@/components/ui/StaleDataBadge';
import { useProfile } from '@/hooks/auth/useProfile';
import { formatRelativeTime } from '@/lib/utils/date';

import { QuestionCardActions } from './QuestionCardActions';
import { StatusBadge } from './StatusBadge';

import type { QuestionWithEvidenceCount, QuestionStatus } from '@/types/question';

interface QuestionCardProps {
  question: QuestionWithEvidenceCount;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const isMaho = profile?.role === 'maho';

  const handleCardClick = () => {
    router.push(`/questions/${question.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      data-testid="question-card"
      role="button"
      tabIndex={0}
      aria-label={`Open question: ${question.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleCardClick();
        }
      }}
      className="block min-h-12 rounded-lg border border-border bg-surface p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Mobile: stacked layout, Desktop: side-by-side */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        {/* Title: more lines on mobile for better readability */}
        <h3 className="font-medium text-foreground line-clamp-3 sm:line-clamp-2 text-sm sm:text-base flex-1">{question.title}</h3>
        {/* Badges row: horizontal on all screens, compact on mobile */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <StatusBadge status={question.status as QuestionStatus} />
          <span data-testid="stale-question-badge">
            <StaleDataBadge updatedAt={question.updated_at} />
          </span>
          {isMaho && (
            <QuestionCardActions
              questionId={question.id}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
      {/* Metadata row: compact on mobile */}
      <div className="mt-2 flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
        <span>{formatRelativeTime(question.created_at)}</span>
        <span
          className="flex items-center gap-1"
          data-testid="evidence-count"
          title={`${question.evidence_count} evidence item${question.evidence_count !== 1 ? 's' : ''}`}
        >
          <FileText className="h-3 w-3" />
          {question.evidence_count}
        </span>
      </div>
    </div>
  );
}
