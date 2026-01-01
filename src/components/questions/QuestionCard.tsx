'use client';

import Link from 'next/link';

import { StaleDataBadge } from '@/components/ui/StaleDataBadge';
import { formatRelativeTime } from '@/lib/utils/date';

import { StatusBadge } from './StatusBadge';

import type { Question } from '@/types/question';

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Link
      href={`/questions/${question.id}`}
      data-testid="question-card"
      className="block min-h-[48px] rounded-md border border-border bg-surface p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-foreground line-clamp-2">{question.title}</h3>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={question.status} />
          <span data-testid="stale-question-badge">
            <StaleDataBadge updatedAt={question.updated_at} />
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatRelativeTime(question.created_at)}
      </p>
    </Link>
  );
}
