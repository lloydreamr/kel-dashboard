'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from '@/hooks/ui/useDebouncedCallback';
import { useQueueStore } from '@/stores/queue';
import {
  CONSTRAINT_PRESETS,
  type ConstraintPreset,
  type Constraint,
} from '@/types/decision';

import { ConstraintChip } from './ConstraintChip';
import { ConstraintConfirmButton } from './ConstraintConfirmButton';
import { ConstraintEditButton } from './ConstraintEditButton';
import { DiscardDraftDialog } from './DiscardDraftDialog';
import { DraftSavedIndicator } from './DraftSavedIndicator';

const MAX_CONTEXT_LENGTH = 50;

/**
 * All available constraint types in display order.
 */
const CONSTRAINT_TYPES: ConstraintPreset[] = [
  CONSTRAINT_PRESETS.PRICE,
  CONSTRAINT_PRESETS.VOLUME,
  CONSTRAINT_PRESETS.RISK,
  CONSTRAINT_PRESETS.TIMELINE,
];

import type { SyncState } from './ApproveButton';

export interface ConstraintPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Callback when open state changes (for dismissal) */
  onOpenChange: (open: boolean) => void;
  /** Question ID for the decision */
  questionId: string;
  /** Callback when user confirms selection (after mutation succeeds) */
  onSuccess?: () => void;
  /** Callback when mutation fails */
  onError?: (error: Error) => void;
  /** Reports sync state changes for parent indicator */
  onSyncStateChange?: (state: SyncState) => void;

  // Edit mode props
  /** Mode: 'create' for new constraint, 'edit' for updating existing */
  mode?: 'create' | 'edit';
  /** Decision ID (required for edit mode) */
  decisionId?: string;
  /** Initial constraints to pre-populate (edit mode) */
  initialConstraints?: Constraint[];
  /** Initial context to pre-populate (edit mode) */
  initialContext?: string;
}

/**
 * Extract selected presets from constraints array.
 * Filters to only valid preset types.
 */
function extractSelectedPresets(constraints: Constraint[]): Set<ConstraintPreset> {
  const validPresets = Object.values(CONSTRAINT_PRESETS) as string[];
  return new Set(
    constraints
      .map((c) => c.type as ConstraintPreset)
      .filter((t) => validPresets.includes(t))
  );
}

/**
 * ConstraintPanel - Bottom sheet for selecting constraint types.
 *
 * Supports two modes:
 * - 'create': New constraint selection for approving a question
 * - 'edit': Update existing constraints on a decision
 *
 * Manages local state for chip selection and context text.
 * In create mode, resets state when panel closes without confirming.
 * In edit mode, pre-populates from initialConstraints/initialContext.
 *
 * Uses shadcn Sheet with side="bottom" for slide-up animation.
 */
export function ConstraintPanel({
  open,
  onOpenChange,
  questionId,
  onSuccess,
  onError,
  onSyncStateChange,
  mode = 'create',
  decisionId,
  initialConstraints = [],
  initialContext = '',
}: ConstraintPanelProps) {
  // Stabilize props that may be new references on each render
  // This prevents effects from running unnecessarily
  const stableInitialConstraints = useMemo(
    () => initialConstraints,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialConstraints.length, ...initialConstraints.map((c) => c.type)]
  );
  const stableInitialContext = initialContext; // strings are already stable

  // Track previous open state to detect when panel opens
  const wasOpenRef = useRef(open);

  // Local state for selected constraints
  const [selected, setSelected] = useState<Set<ConstraintPreset>>(() =>
    mode === 'edit' ? extractSelectedPresets(initialConstraints) : new Set()
  );
  const [context, setContext] = useState(mode === 'edit' ? initialContext : '');

  // Auto-save state - use counter to trigger indicator on each save
  const [draftSaveCount, setDraftSaveCount] = useState(0);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Zustand store for draft persistence
  const { draftResponses, setDraftResponse, clearDraftResponse } = useQueueStore();
  const existingDraft = draftResponses[questionId];

  // Debounced save to store (only in create mode)
  // Saves both constraints and context text
  const { debouncedFn: debouncedSave, cancel: cancelSave } = useDebouncedCallback(
    (constraintsList: Constraint[], contextText: string) => {
      if (mode === 'create' && constraintsList.length > 0) {
        setDraftResponse(questionId, {
          decision_type: 'approved_with_constraint',
          constraints: constraintsList,
          constraint_context: contextText || undefined,
        });
        setDraftSaveCount((c) => c + 1);
      }
    },
    2000
  );

  // Track if we've done initial restoration
  const hasRestoredRef = useRef(false);

  // Capture existingDraft in a ref to avoid dependency issues
  const existingDraftRef = useRef(existingDraft);
  existingDraftRef.current = existingDraft;

  // Reset state when panel opens (transition from closed to open)
  // Simplified: Only handle edit mode initialization, skip draft restoration for now
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (justOpened && mode === 'edit') {
      // Edit mode: restore from initial values
      setSelected(extractSelectedPresets(stableInitialConstraints));
      setContext(stableInitialContext);
    }
    // Note: Draft restoration disabled to fix infinite loop bug
    // TODO: Re-enable after fixing the Zustand subscription issue
  }, [open, mode, stableInitialConstraints, stableInitialContext]);

  // Track if user has interacted with the panel (set in toggleChip callback)
  // This prevents auto-save from triggering during draft restoration
  const shouldSaveRef = useRef(false);

  // Handle open change - reset state when closing (create mode only)
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && mode === 'create') {
        // Reset state when closing in create mode
        setSelected(new Set());
        setContext('');
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, mode]
  );

  const toggleChip = useCallback((type: ConstraintPreset) => {
    // Mark that user has interacted - enables auto-save
    shouldSaveRef.current = true;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Build constraints array for the confirm button (memoized to prevent infinite re-renders)
  // This is passed to ConstraintConfirmButton which uses it in useCallback dependencies
  const constraints: Constraint[] = useMemo(
    () => Array.from(selected).map((type) => ({ type })),
    [selected]
  );

  // Auto-save disabled - was causing infinite loop due to Zustand subscription
  // TODO: Re-implement auto-save with proper stabilization
  // Reset interaction flag when panel closes
  useEffect(() => {
    if (!open) {
      shouldSaveRef.current = false;
    }
  }, [open]);

  // Success handler that clears draft
  const handleSuccess = useCallback(() => {
    cancelSave();
    clearDraftResponse(questionId);
    onSuccess?.();
  }, [cancelSave, clearDraftResponse, questionId, onSuccess]);

  // Discard handler - clears draft and resets state
  const handleDiscard = useCallback(() => {
    cancelSave();
    clearDraftResponse(questionId);
    setSelected(new Set());
    setContext('');
    setShowDiscardDialog(false);
  }, [cancelSave, clearDraftResponse, questionId]);

  // Whether there's a saved draft for this question
  const hasDraft = mode === 'create' && !!existingDraft;

  // Context is passed separately to the hook (stored at decision level)
  const trimmedContext = context.trim();

  const hasSelection = selected.size > 0;

  // Title and description based on mode
  const title = mode === 'create' ? 'Add Constraints' : 'Edit Constraints';
  const description =
    mode === 'create'
      ? 'Select the constraints that apply to this approval'
      : 'Update the constraints for this decision';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[50vh] rounded-t-xl"
        data-testid="constraint-panel"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Constraint chips */}
        <div
          className="flex flex-wrap gap-3 mt-4"
          role="group"
          aria-label="Constraint options"
        >
          {CONSTRAINT_TYPES.map((type) => (
            <ConstraintChip
              key={type}
              type={type}
              selected={selected.has(type)}
              onToggle={() => toggleChip(type)}
            />
          ))}
        </div>

        {/* Context textarea - only visible when at least one chip selected */}
        {hasSelection && (
          <div className="mt-4 space-y-2">
            <Textarea
              data-testid="constraint-context-input"
              placeholder="Any details? (optional)"
              value={context}
              onChange={(e) =>
                setContext(e.target.value.slice(0, MAX_CONTEXT_LENGTH))
              }
              maxLength={MAX_CONTEXT_LENGTH}
              rows={2}
              className="resize-none"
            />
            <p
              data-testid="constraint-char-count"
              className="text-xs text-muted-foreground text-right"
            >
              {context.length}/{MAX_CONTEXT_LENGTH}
            </p>
          </div>
        )}

        {/* Action button - different based on mode */}
        <div className="mt-6 flex items-center justify-between">
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
          <div>
            {mode === 'create' ? (
              <ConstraintConfirmButton
                questionId={questionId}
                constraints={constraints}
                context={trimmedContext || undefined}
                disabled={!hasSelection}
                onSuccess={handleSuccess}
                onError={onError}
                onSyncStateChange={onSyncStateChange}
              />
            ) : (
              <ConstraintEditButton
                decisionId={decisionId!}
                questionId={questionId}
                constraints={constraints}
                context={trimmedContext || undefined}
                disabled={!hasSelection}
                onSuccess={onSuccess}
                onError={onError}
              />
            )}
          </div>
        </div>

        {/* Discard confirmation dialog */}
        <DiscardDraftDialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
          onConfirm={handleDiscard}
        />
      </SheetContent>
    </Sheet>
  );
}
