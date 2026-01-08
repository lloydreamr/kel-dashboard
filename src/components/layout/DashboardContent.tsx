/**
 * DashboardContent Component
 *
 * Client Component wrapper for dashboard layout.
 * Handles pitch mode visibility for sidebar and mobile navigation.
 * Also provides global keyboard shortcuts (P3-1).
 *
 * This component exists because layout.tsx is a Server Component
 * (uses async, cookies()) and cannot use React hooks like Zustand.
 * The layout passes UI elements as props here where we can
 * conditionally render based on pitch mode state.
 *
 * Story 11.1: Pitch Mode View
 * Story 11.2: Added PDF export integration via Zustand callbacks
 * P3-1: Added global keyboard shortcuts
 *
 * @example
 * ```tsx
 * // In layout.tsx (Server Component)
 * <DashboardContent
 *   sidebar={<Sidebar />}
 *   mobileNav={<MobileNav />}
 * >
 *   {children}
 * </DashboardContent>
 * ```
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { KeyboardShortcutsOverlay } from '@/components/layout/KeyboardShortcutsOverlay';
import { PitchModeHeader } from '@/components/visualization';
import { useKeyboardShortcuts } from '@/hooks/ui/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { usePitchModeStore } from '@/stores/pitchMode';

interface DashboardContentProps {
  /** Desktop sidebar component */
  sidebar: React.ReactNode;
  /** Mobile navigation component */
  mobileNav: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
}

export function DashboardContent({
  sidebar,
  mobileNav,
  children,
}: DashboardContentProps) {
  const router = useRouter();
  const isPitchMode = usePitchModeStore((s) => s.isPitchMode);
  const isGeneratingPdf = usePitchModeStore((s) => s.isGeneratingPdf);
  const onDownloadPdf = usePitchModeStore((s) => s.onDownloadPdf);

  // Keyboard shortcuts state (P3-1)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const handleToggleHelp = useCallback(() => {
    setShowShortcutsHelp((prev) => !prev);
  }, []);

  const handleCloseHelp = useCallback(() => {
    setShowShortcutsHelp(false);
  }, []);

  // Enable global keyboard shortcuts
  useKeyboardShortcuts({
    enabled: !isPitchMode, // Disable during pitch mode
    onToggleHelp: handleToggleHelp,
    onEscape: handleCloseHelp,
  });

  // Exit handler navigates to visualization page without pitch mode.
  // The URL change triggers usePitchMode hook in page to sync store.
  const handleExit = () => {
    router.push('/visualization', { scroll: false });
  };

  // PDF download handler - calls the callback registered by VisualizationPageClient
  const handleDownloadPdf = onDownloadPdf ?? undefined;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - hidden in pitch mode */}
      <div className={cn(isPitchMode && 'hidden')}>{sidebar}</div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile: Show PitchModeHeader OR MobileNav */}
        <div className="md:hidden">
          {isPitchMode ? (
            <PitchModeHeader
              onExit={handleExit}
              onDownloadPdf={handleDownloadPdf}
              isGeneratingPdf={isGeneratingPdf}
            />
          ) : (
            mobileNav
          )}
        </div>

        {/* Desktop: Show PitchModeHeader when in pitch mode */}
        {isPitchMode && (
          <div className="hidden md:block">
            <PitchModeHeader
              onExit={handleExit}
              onDownloadPdf={handleDownloadPdf}
              isGeneratingPdf={isGeneratingPdf}
            />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>

      {/* Keyboard Shortcuts Help Overlay (P3-1) */}
      <KeyboardShortcutsOverlay
        open={showShortcutsHelp}
        onOpenChange={setShowShortcutsHelp}
      />
    </div>
  );
}
