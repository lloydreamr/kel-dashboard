'use client';

/**
 * QueueList Component
 *
 * Container for queue cards with proper loading/empty states.
 * Manages expand/collapse via Zustand store.
 * Uses AnimatePresence for smooth card entry/exit animations.
 */

import { AnimatePresence } from 'framer-motion';

import { useQueueStore } from '@/stores/queue';

import { QueueCard } from './QueueCard';
import { QueueLoadingSkeleton } from './QueueCardSkeleton';
import { QueueEmptyState } from './QueueEmptyState';

import type { Question } from '@/types/question';

interface QueueListProps {
  questions: Question[] | undefined;
  isLoading: boolean;
}

export function QueueList({ questions, isLoading }: QueueListProps) {
  const { expandedCardId, toggleCard, collapseCard } = useQueueStore();

  // When a card is approved, clear the expanded state
  const handleApproved = (questionId: string) => {
    if (expandedCardId === questionId) {
      collapseCard();
    }
  };

  if (isLoading) {
    return <QueueLoadingSkeleton />;
  }

  if (!questions || questions.length === 0) {
    return <QueueEmptyState />;
  }

  return (
    <div data-testid="queue-list" className="space-y-3">
      <AnimatePresence mode="popLayout">
        {questions.map((question) => (
          <QueueCard
            key={question.id}
            question={question}
            isExpanded={expandedCardId === question.id}
            onToggle={() => toggleCard(question.id)}
            onApproved={handleApproved}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
