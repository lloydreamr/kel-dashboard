/**
 * DownloadPdfButton Component
 *
 * Button for triggering PDF export in Pitch Mode.
 * Shows loading state during PDF generation.
 *
 * Story 11.2: PDF One-Pager Export (Task 4)
 *
 * @example
 * ```tsx
 * <DownloadPdfButton
 *   onClick={handleDownloadPdf}
 *   isGenerating={isGenerating}
 * />
 * ```
 */

'use client';

import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DownloadPdfButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;
  /** Whether PDF is currently being generated */
  isGenerating: boolean;
}

export function DownloadPdfButton({ onClick, isGenerating }: DownloadPdfButtonProps) {
  return (
    <Button
      variant="default"
      onClick={onClick}
      disabled={isGenerating}
      data-testid="pdf-download-button"
      aria-busy={isGenerating}
      aria-label="Download PDF"
      className="min-h-12 px-4"
    >
      {isGenerating ? (
        <>
          <Loader2
            className="h-4 w-4 animate-spin"
            data-testid="pdf-generating-indicator"
          />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </>
      )}
    </Button>
  );
}
