'use client';

/**
 * QuestionCard Component
 *
 * Displays a question summary with status, stale badge, and quick actions.
 * Quick actions menu visible only for Maho.
 */

import { useRouter } from 'next/navigation';

import { StaleDataBadge } from '@/components/ui/StaleDataBadge';
import { useProfile } from '@/hooks/auth/useProfile';
import { formatRelativeTime } from '@/lib/utils/date';

import { QuestionCardActions } from './QuestionCardActions';
import { StatusBadge } from './StatusBadge';

import type { Question } from '@/types/question';

interface QuestionCardProps {
  question: Question;
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleCardClick();
        }
      }}
      className="block min-h-[48px] rounded-md border border-border bg-surface p-4 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-foreground line-clamp-2">{question.title}</h3>
        <div className="flex items-center gap-1.5">
          {isMaho && (
            <QuestionCardActions
              questionId={question.id}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <StatusBadge status={question.status} />
          <span data-testid="stale-question-badge">
            <StaleDataBadge updatedAt={question.updated_at} />
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatRelativeTime(question.created_at)}
      </p>
    </div>
  );
}
