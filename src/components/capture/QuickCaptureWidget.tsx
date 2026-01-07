'use client';

/**
 * QuickCaptureWidget
 *
 * Client component that combines FAB + Sheet + capture hooks.
 * Renders the floating action button and handles the complete capture flow.
 *
 * Story 10-5: Quick Capture Mode
 *
 * @example
 * // In a server component (e.g., dashboard layout):
 * <QuickCaptureWidget userId={user.id} />
 */

import { useMemo, useState } from 'react';

import { useQuickCapture, useCaptureSync } from '@/hooks/capture';
import { useQuestions } from '@/hooks/questions';

import { QuickCaptureFAB } from './QuickCaptureFAB';
import {
  QuickCaptureSheet,
  type QuickCaptureData,
  type QuestionOption,
} from './QuickCaptureSheet';

interface QuickCaptureWidgetProps {
  /** User ID for storage path scoping */
  userId: string;
  /** Question ID to attach captures to (optional) */
  questionId?: string;
}

/**
 * Widget that provides complete quick capture functionality.
 *
 * Features:
 * - Floating action button (FAB) for triggering capture
 * - Bottom sheet for photo selection + note entry
 * - Automatic upload to Supabase Storage
 * - Evidence record creation
 * - Offline queue sync indicator
 */
export function QuickCaptureWidget({
  userId,
  questionId,
}: QuickCaptureWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // Track the selected question ID from the sheet (may differ from prop)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    questionId ?? null
  );

  // Fetch questions for the selector
  const { data: questions = [] } = useQuestions();

  // Convert to QuestionOption format for the sheet
  const questionOptions: QuestionOption[] = useMemo(
    () =>
      questions.map((q) => ({
        id: q.id,
        title: q.title,
        category: q.category,
      })),
    [questions]
  );

  // Quick capture hook for uploading - uses activeQuestionId which can be
  // overridden by the sheet's question selector
  const { submitCapture, isSubmitting } = useQuickCapture({
    userId,
    questionId: activeQuestionId ?? undefined,
    onSuccess: () => {
      setSheetOpen(false);
    },
  });

  // Sync hook for offline captures (runs in background)
  const { pendingCount, isSyncing, refreshCount } = useCaptureSync({
    userId,
    autoSync: true,
  });

  const handleCapture = async (data: QuickCaptureData) => {
    // Use the questionId from the capture data (selected in sheet)
    setActiveQuestionId(data.questionId);
    await submitCapture(data);
    // Refresh pending count in case this was an offline queue
    await refreshCount();
  };

  const handleOpenSheet = () => {
    setSheetOpen(true);
  };

  return (
    <>
      {/* FAB with pending indicator */}
      <QuickCaptureFAB
        onClick={handleOpenSheet}
        disabled={isSubmitting || isSyncing}
        className={pendingCount > 0 ? 'ring-2 ring-warning ring-offset-2' : ''}
      />

      {/* Capture sheet */}
      <QuickCaptureSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCapture={handleCapture}
        isSubmitting={isSubmitting}
        questions={questionOptions}
        defaultQuestionId={questionId ?? null}
      />

      {/* Pending sync badge (positioned above FAB) */}
      {pendingCount > 0 && (
        <div
          className="fixed bottom-20 right-6 z-50 rounded-full bg-warning px-2 py-1 text-xs font-medium text-warning-foreground shadow-md"
          data-testid="quick-capture-pending"
        >
          {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
        </div>
      )}
    </>
  );
}
