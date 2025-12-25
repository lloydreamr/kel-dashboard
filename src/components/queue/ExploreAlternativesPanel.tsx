'use client';

/**
 * ExploreAlternativesPanel Component
 *
 * Inline expandable panel for entering reasoning when requesting alternatives.
 * Uses AnimatePresence + motion.div for smooth expand/collapse animation.
 *
 * Unlike ConstraintPanel (which uses Sheet), this panel expands inline
 * within the QueueCard to keep focus on the card content.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useCallback, useEffect, useRef } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from '@/hooks/ui/useDebouncedCallback';
import { ANIMATION } from '@/lib/constants/animations';
import { useQueueStore } from '@/stores/queue';

import { DiscardDraftDialog } from './DiscardDraftDialog';
import { DraftSavedIndicator } from './DraftSavedIndicator';
import { ExploreAlternativesSubmitButton } from './ExploreAlternativesSubmitButton';

import type { SyncState } from './ApproveButton';

export interface ExploreAlternativesPanelProps {
  /** Whether the panel is expanded */
  expanded: boolean;
  /** Question ID for the decision */
  questionId: string;
  /** Callback when user successfully submits */
  onSuccess?: () => void;
  /** Callback when mutation fails */
  onError?: (error: Error) => void;
  /** Callback to cancel/collapse the panel */
  onCancel: () => void;
  /** Reports sync state changes for parent indicator */
  onSyncStateChange?: (state: SyncState) => void;
}

/**
 * ExploreAlternativesPanel - Inline expandable textarea for entering reasoning.
 *
 * Displays:
 * - Textarea with placeholder "What concerns you? What would you prefer?"
 * - Character count (display only, no max limit per spec)
 * - Submit button (disabled when empty) - uses ExploreAlternativesSubmitButton
 * - Cancel button to collapse without submitting
 *
 * Resets reasoning when collapsed.
 */
export function ExploreAlternativesPanel({
  expanded,
  questionId,
  onSuccess,
  onError,
  onCancel,
  onSyncStateChange,
}: ExploreAlternativesPanelProps) {
  const [reasoning, setReasoning] = useState('');
  const [draftSaveCount, setDraftSaveCount] = useState(0);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Track previous expanded state and if we've restored
  const wasExpandedRef = useRef(expanded);
  const hasRestoredRef = useRef(false);

  // Zustand store for draft persistence
  const { draftResponses, setDraftResponse, clearDraftResponse } = useQueueStore();
  const existingDraft = draftResponses[questionId];

  // Debounced save to store
  const { debouncedFn: debouncedSave, cancel: cancelSave } = useDebouncedCallback(
    (reasoningText: string) => {
      if (reasoningText.trim().length > 0) {
        setDraftResponse(questionId, {
          decision_type: 'explore_alternatives',
          reasoning: reasoningText,
        });
        setDraftSaveCount((c) => c + 1);
      }
    },
    2000
  );

  // Restore draft when panel expands (transition from collapsed to expanded)
  useEffect(() => {
    const justExpanded = expanded && !wasExpandedRef.current;
    wasExpandedRef.current = expanded;

    if (justExpanded && existingDraft?.reasoning) {
      setReasoning(existingDraft.reasoning);
      hasRestoredRef.current = true;
    }
  }, [expanded, existingDraft]);

  // Initial mount restoration (when panel starts expanded with draft)
  useEffect(() => {
    if (expanded && existingDraft?.reasoning && !hasRestoredRef.current) {
      setReasoning(existingDraft.reasoning);
      hasRestoredRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger debounced save when reasoning changes
  useEffect(() => {
    if (expanded && reasoning.length > 0) {
      debouncedSave(reasoning);
    }
  }, [reasoning, expanded, debouncedSave]);

  // Handle cancel - reset reasoning and collapse
  const handleCancel = useCallback(() => {
    cancelSave();
    setReasoning('');
    onCancel();
  }, [onCancel, cancelSave]);

  // Reset reasoning when panel collapses
  const handleAnimationComplete = useCallback(() => {
    if (!expanded) {
      setReasoning('');
    }
  }, [expanded]);

  // Handle success from submit button - also clear draft
  const handleSuccess = useCallback(() => {
    cancelSave();
    clearDraftResponse(questionId);
    setReasoning('');
    onSuccess?.();
  }, [onSuccess, cancelSave, clearDraftResponse, questionId]);

  // Discard handler - clears draft and resets state
  const handleDiscard = useCallback(() => {
    cancelSave();
    clearDraftResponse(questionId);
    setReasoning('');
    setShowDiscardDialog(false);
  }, [cancelSave, clearDraftResponse, questionId]);

  // Whether there's a saved draft for this question
  const hasDraft = !!existingDraft?.reasoning;

  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          data-testid="alternatives-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={ANIMATION.expand}
          onAnimationComplete={handleAnimationComplete}
          className="overflow-hidden mt-4"
        >
          <div className="space-y-3 pt-2 border-t border-border">
            {/* Reasoning textarea */}
            <Textarea
              data-testid="alternatives-reasoning-input"
              placeholder="What concerns you? What would you prefer?"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={3}
              className="resize-none"
            />

            {/* Character count and draft indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DraftSavedIndicator trigger={draftSaveCount} />
                {hasDraft && (
                  <button
                    type="button"
                    data-testid="discard-draft-button"
                    onClick={() => setShowDiscardDialog(true)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Discard draft
                  </button>
                )}
              </div>
              <p
                data-testid="alternatives-char-count"
                className="text-xs text-muted-foreground"
              >
                {reasoning.length} characters
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              {/* Cancel button */}
              <button
                type="button"
                data-testid="alternatives-cancel-button"
                onClick={handleCancel}
                className="min-h-[48px] px-4 py-2 text-muted-foreground hover:text-foreground transition-colors
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
              >
                Cancel
              </button>

              {/* Submit button - handles haptic and toast */}
              <ExploreAlternativesSubmitButton
                questionId={questionId}
                reasoning={reasoning}
                onSuccess={handleSuccess}
                onError={onError}
                onSyncStateChange={onSyncStateChange}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Discard confirmation dialog */}
      <DiscardDraftDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onConfirm={handleDiscard}
      />
    </AnimatePresence>
  );
}
