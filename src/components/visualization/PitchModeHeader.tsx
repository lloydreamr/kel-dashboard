/**
 * PitchModeHeader Component
 *
 * Clean, professional header for pitch mode.
 * Displays Kel branding, PDF download button, and exit button.
 *
 * Story 11.1: Pitch Mode View
 * Story 11.2: Added PDF download button
 *
 * @example
 * ```tsx
 * <PitchModeHeader
 *   onExit={() => router.push('/visualization')}
 *   onDownloadPdf={handleDownload}
 *   isGeneratingPdf={false}
 * />
 * ```
 */

'use client';

import { Button } from '@/components/ui/button';

import { DownloadPdfButton } from './DownloadPdfButton';

interface PitchModeHeaderProps {
  /** Callback when exit button is clicked */
  onExit: () => void;
  /** Callback when download PDF button is clicked (optional) */
  onDownloadPdf?: () => void;
  /** Whether PDF is currently being generated (optional) */
  isGeneratingPdf?: boolean;
}

export function PitchModeHeader({
  onExit,
  onDownloadPdf,
  isGeneratingPdf = false,
}: PitchModeHeaderProps) {
  return (
    <header
      data-testid="pitch-mode-header"
      className="sticky top-0 z-50 w-full bg-background border-b border-border"
    >
      <div className="container flex items-center justify-between py-4 px-4 md:px-6">
        {/* Kel branding */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Kel</span>
          <span className="text-muted-foreground hidden sm:inline">
            Competitor Positioning
          </span>
        </div>

        {/* Button group - Download PDF + Exit */}
        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <DownloadPdfButton
              onClick={onDownloadPdf}
              isGenerating={isGeneratingPdf}
            />
          )}
          <Button
            variant="outline"
            onClick={onExit}
            data-testid="exit-pitch-mode-button"
            className="min-h-12 px-4"
          >
            Exit Pitch Mode
          </Button>
        </div>
      </div>
    </header>
  );
}
