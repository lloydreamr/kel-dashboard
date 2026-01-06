/**
 * Quick Capture Components
 *
 * Components for the quick capture feature (Story 10-5).
 * Allows field researchers to quickly take photos and attach notes
 * as evidence during research trips.
 *
 * @example
 * // Simple: Use the widget (recommended for dashboard)
 * import { QuickCaptureWidget } from '@/components/capture';
 * <QuickCaptureWidget userId={user.id} />
 *
 * @example
 * // Advanced: Manual control over FAB and Sheet
 * import { QuickCaptureSheet, QuickCaptureFAB } from '@/components/capture';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *   return (
 *     <>
 *       <QuickCaptureFAB onClick={() => setOpen(true)} />
 *       <QuickCaptureSheet
 *         open={open}
 *         onOpenChange={setOpen}
 *         onCapture={handleCapture}
 *       />
 *     </>
 *   );
 * }
 */

export { QuickCaptureSheet, type QuickCaptureData } from './QuickCaptureSheet';
export { QuickCaptureFAB } from './QuickCaptureFAB';
export { QuickCaptureWidget } from './QuickCaptureWidget';
