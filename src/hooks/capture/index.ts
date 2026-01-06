/**
 * Quick Capture Hooks
 *
 * Hooks for the quick capture feature (Story 10-5).
 * Handles photo upload, evidence creation, and offline sync.
 *
 * @example
 * import { useQuickCapture, useCaptureSync } from '@/hooks/capture';
 *
 * function CaptureButton() {
 *   const { submitCapture, isSubmitting } = useQuickCapture({
 *     userId: user.id,
 *     questionId: currentQuestion?.id,
 *     onSuccess: () => closeSheet(),
 *   });
 *
 *   // Sync offline captures when back online
 *   const { pendingCount, isSyncing } = useCaptureSync({
 *     userId: user.id,
 *   });
 *
 *   return (
 *     <>
 *       <QuickCaptureSheet
 *         onCapture={submitCapture}
 *         disabled={isSubmitting}
 *       />
 *       {pendingCount > 0 && <Badge>{pendingCount} pending</Badge>}
 *     </>
 *   );
 * }
 */

export {
  useQuickCapture,
  type UseQuickCaptureOptions,
  type UseQuickCaptureResult,
} from './useQuickCapture';

export {
  useCaptureSync,
  type UseCapturesSyncOptions,
  type UseCapturesSyncResult,
} from './useCaptureSync';
