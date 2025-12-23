'use client';

import Link from 'next/link';

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
        <StatusBadge status={question.status} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatRelativeTime(question.created_at)}
      </p>
    </Link>
  );
}
