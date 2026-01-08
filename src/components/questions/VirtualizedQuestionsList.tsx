'use client';

/**
 * VirtualizedQuestionsList Component
 *
 * Renders a virtualized list of questions for performance with large datasets.
 * Uses @tanstack/react-virtual for windowing.
 *
 * Story 13.3 AC #7: Lists with 200+ questions use virtualization
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import { QuestionCard } from './QuestionCard';

import type { Question } from '@/types/database';

interface VirtualizedQuestionsListProps {
  questions: Question[];
  /**
   * Maximum height of the scroll container.
   * Defaults to 'calc(100vh - 300px)' which works for typical page layouts.
   * Pass a custom value if the component is used in different contexts.
   */
  maxHeight?: string;
}

/** Estimated height of a question card in pixels */
const ESTIMATED_ITEM_SIZE = 120;

/** Number of items to render above/below the visible window */
const OVERSCAN_COUNT = 5;

/** Default max height accounting for typical header/filter area */
const DEFAULT_MAX_HEIGHT = 'calc(100vh - 300px)';

export function VirtualizedQuestionsList({
  questions,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: VirtualizedQuestionsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_SIZE,
    overscan: OVERSCAN_COUNT,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      data-testid="questions-list"
      className="overflow-auto"
      style={{ contain: 'strict', maxHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const question = questions[virtualItem.index];
          return (
            <div
              key={question.id}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="pb-3"
            >
              <QuestionCard question={question} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
