'use client';

/**
 * QueueCard Component
 *
 * Card displaying a question pending Kel's decision.
 * Supports collapsed and expanded states with smooth animations.
 * Includes approval workflow with celebration and exit animations.
 *
 * Collapsed: Title, recommendation preview, category badge
 * Expanded: Full recommendation, evidence count, action buttons
 *
 * Approval flow:
 * 1. User taps Approve → haptic + loading
 * 2. Celebration animation (600ms)
 * 3. Card exit animation (200ms)
 * 4. Card removed from DOM
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';

import { CategoryBadge } from '@/components/questions/CategoryBadge';
import { EvidenceCountBadge } from '@/components/questions/EvidenceCountBadge';
import { useEvidenceCount } from '@/hooks/evidence';
import { useSyncIndicator } from '@/hooks/queue';
import { ANIMATION } from '@/lib/constants/animations';

import { ApprovalCelebration } from './ApprovalCelebration';
import { ApproveButton } from './ApproveButton';
import { ConstraintPanel } from './ConstraintPanel';
import { ExploreAlternativesButton } from './ExploreAlternativesButton';
import { ExploreAlternativesPanel } from './ExploreAlternativesPanel';
import { SyncStatusIndicator } from './SyncStatusIndicator';

import type { SyncState } from './ApproveButton';
import type { SyncStatus } from './SyncStatusIndicator';
import type { Question } from '@/types/question';

/** Card approval state for animation sequencing */
type ApprovalState = 'idle' | 'celebrating' | 'exiting' | 'exited';

interface QueueCardProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
  /** Called when card approval animation completes */
  onApproved?: (questionId: string) => void;
}

/**
 * Collapsed card header - always visible.
 */
function CardHeader({
  question,
  isExpanded,
  onToggle,
  syncStatus,
  syncTrigger,
  onSyncRetry,
}: {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
  syncStatus: SyncStatus;
  syncTrigger: number;
  onSyncRetry?: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="queue-card-header"
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isExpanded}
      className="w-full text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-t-lg min-h-[48px] p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">
            {isExpanded ? (
              question.title
            ) : (
              <span className="truncate block">{question.title}</span>
            )}
          </h3>

          {/* Recommendation preview - only in collapsed state */}
          {!isExpanded && question.recommendation && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {question.recommendation}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <CategoryBadge
            questionId={question.id}
            category={question.category}
            isEditable={false}
          />
          {/* Sync status indicator - right side, before chevron */}
          <SyncStatusIndicator
            status={syncStatus}
            trigger={syncTrigger}
            onRetry={onSyncRetry}
          />
          {/* Collapse/expand indicator */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={ANIMATION.fade}
            className="text-muted-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.span>
        </div>
      </div>
    </button>
  );
}

/**
 * Expanded content - full recommendation, evidence count, actions.
 */
function ExpandedContent({
  question,
  onToggle,
  onApproveComplete,
  onOpenConstraintPanel,
  alternativesPanelExpanded,
  onToggleAlternativesPanel,
  onAlternativesSuccess,
  onSyncStateChange,
}: {
  question: Question;
  onToggle: () => void;
  onApproveComplete: () => void;
  onOpenConstraintPanel: () => void;
  alternativesPanelExpanded: boolean;
  onToggleAlternativesPanel: () => void;
  onAlternativesSuccess: () => void;
  onSyncStateChange: (state: SyncState) => void;
}) {
  const { count: evidenceCount, isLoading: evidenceLoading } = useEvidenceCount(
    question.id
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={ANIMATION.expand}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 space-y-4">
        {/* Full recommendation */}
        {question.recommendation && (
          <div data-testid="queue-card-recommendation">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Recommendation
            </h4>
            <p className="text-foreground">{question.recommendation}</p>
          </div>
        )}

        {/* Evidence count */}
        <div data-testid="queue-card-evidence-count">
          {evidenceLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <EvidenceCountBadge count={evidenceCount} />
          )}
        </div>

        {/* Action buttons - Stories 4.4-4.6 */}
        <div
          data-testid="queue-card-actions"
          className="flex flex-wrap gap-2 pt-2 border-t border-border"
        >
          {/* Story 4.4: Single-tap approve */}
          <ApproveButton
            question={question}
            onApproveComplete={onApproveComplete}
            onSyncStateChange={onSyncStateChange}
          />

          {/* Story 4.5: Approve with constraints */}
          <button
            type="button"
            data-testid="approve-with-constraint-button"
            onClick={onOpenConstraintPanel}
            className="min-h-[48px] px-4 py-2 rounded-lg border border-border text-foreground font-medium
              hover:bg-muted transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Approve with Constraint
          </button>

          {/* Story 4.6: Explore alternatives */}
          <ExploreAlternativesButton
            expanded={alternativesPanelExpanded}
            onToggle={onToggleAlternativesPanel}
          />
        </div>

        {/* Story 4.6: Explore Alternatives inline panel */}
        <ExploreAlternativesPanel
          expanded={alternativesPanelExpanded}
          questionId={question.id}
          onSuccess={onAlternativesSuccess}
          onCancel={onToggleAlternativesPanel}
          onSyncStateChange={onSyncStateChange}
        />

        {/* Collapse button */}
        <button
          type="button"
          data-testid="queue-card-collapse-button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="min-h-[48px] w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Collapse
        </button>
      </div>
    </motion.div>
  );
}

export function QueueCard({
  question,
  isExpanded,
  onToggle,
  onApproved,
}: QueueCardProps) {
  const [approvalState, setApprovalState] = useState<ApprovalState>('idle');
  const [isConstraintPanelOpen, setIsConstraintPanelOpen] = useState(false);
  const [isAlternativesPanelExpanded, setIsAlternativesPanelExpanded] =
    useState(false);

  // Sync state tracking for all decision actions
  const [syncState, setSyncState] = useState<SyncState>({
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  // Convert sync state to indicator props
  const { status: syncStatus, trigger: syncTrigger } = useSyncIndicator(syncState);

  // Unified callback for sync state changes from any action button
  const handleSyncStateChange = useCallback((state: SyncState) => {
    setSyncState(state);
  }, []);

  // Handle approval completion - start celebration
  // Memoized to prevent infinite loop in child components
  const handleApproveComplete = useCallback(() => {
    setApprovalState('celebrating');
  }, []);

  // Handle constraint approval success - close panel and start celebration
  // Memoized to prevent ConstraintPanel → ConstraintConfirmButton dependency chain loop
  const handleConstraintSuccess = useCallback(() => {
    setIsConstraintPanelOpen(false);
    setApprovalState('celebrating');
  }, []);

  // Handle alternatives panel success - collapse panel and animate out (AC9)
  // Memoized to prevent ExploreAlternativesPanel dependency chain loop
  const handleAlternativesSuccess = useCallback(() => {
    setIsAlternativesPanelExpanded(false);
    setApprovalState('celebrating');
  }, []);

  // Handle celebration complete - start exit animation
  const handleCelebrationComplete = useCallback(() => {
    setApprovalState('exiting');
  }, []);

  // Handle exit animation complete - notify parent
  const handleExitComplete = useCallback(() => {
    setApprovalState('exited');
    onApproved?.(question.id);
  }, [onApproved, question.id]);

  // Don't render if exited
  if (approvalState === 'exited') {
    return null;
  }

  return (
    <motion.div
      layout
      data-testid={isExpanded ? 'queue-card-expanded' : 'queue-card-collapsed'}
      className="relative rounded-lg border border-border bg-surface transition-colors hover:bg-muted/50"
      // Exit animation when exiting state
      animate={
        approvalState === 'exiting'
          ? { opacity: 0, y: -20, height: 0 }
          : { opacity: 1, y: 0, height: 'auto' }
      }
      transition={ANIMATION.cardExit}
      onAnimationComplete={() => {
        if (approvalState === 'exiting') {
          handleExitComplete();
        }
      }}
    >
      <CardHeader
        question={question}
        isExpanded={isExpanded}
        onToggle={approvalState === 'idle' ? onToggle : () => {}}
        syncStatus={syncStatus}
        syncTrigger={syncTrigger}
        onSyncRetry={syncState.retryFn}
      />

      <AnimatePresence>
        {isExpanded && approvalState !== 'exiting' && (
          <ExpandedContent
            question={question}
            onToggle={onToggle}
            onApproveComplete={handleApproveComplete}
            onOpenConstraintPanel={() => setIsConstraintPanelOpen(true)}
            alternativesPanelExpanded={isAlternativesPanelExpanded}
            onToggleAlternativesPanel={() =>
              setIsAlternativesPanelExpanded((prev) => !prev)
            }
            onAlternativesSuccess={handleAlternativesSuccess}
            onSyncStateChange={handleSyncStateChange}
          />
        )}
      </AnimatePresence>

      {/* Celebration overlay */}
      <AnimatePresence>
        {approvalState === 'celebrating' && (
          <ApprovalCelebration onComplete={handleCelebrationComplete} />
        )}
      </AnimatePresence>

      {/* Constraint panel - rendered outside card for proper sheet positioning */}
      <ConstraintPanel
        open={isConstraintPanelOpen}
        onOpenChange={setIsConstraintPanelOpen}
        questionId={question.id}
        onSuccess={handleConstraintSuccess}
        onSyncStateChange={handleSyncStateChange}
      />
    </motion.div>
  );
}
