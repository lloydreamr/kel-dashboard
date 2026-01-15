'use client';

/**
 * PitchExportPreviewDialog Component
 *
 * Dialog for previewing and exporting pitch deck as PDF with AI-generated summary.
 * Generates summary on open, shows preview, and allows PDF download.
 *
 * Story 18-3: Export with AI Summary
 */

import { useEffect, useRef, useState } from 'react';
import { FileDown, RefreshCw, AlertCircle, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { PitchPdfExportContent } from './PitchPdfExportContent';
import { useGeneratePitchSummary, useUpdatePitchDraftStatus } from '@/hooks/pitch';
import { usePdfExport } from '@/hooks/visualization/usePdfExport';

import type { PitchSectionWithSources } from '@/types/pitch';
import type { CompetitorDataPoint } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface MarketGap {
  id: string;
  title: string;
  description: string;
  evidence?: string;
}

interface PitchExportPreviewDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Pitch draft ID for summary generation */
  pitchDraftId: string;
  /** Pitch title for PDF header */
  pitchTitle: string;
  /** Pitch sections to include in PDF */
  sections: PitchSectionWithSources[];
  /** Optional competitor data for chart */
  competitorData?: CompetitorDataPoint[];
  /** Optional Kel position for chart */
  kelPosition?: CompetitorDataPoint | null;
  /** Optional market gaps for display */
  marketGaps?: MarketGap[];
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog with PDF preview and export functionality.
 * Generates AI summary when opened, then renders preview with export button.
 */
export function PitchExportPreviewDialog({
  open,
  onOpenChange,
  pitchDraftId,
  pitchTitle,
  sections,
  competitorData = [],
  kelPosition,
  marketGaps = [],
}: PitchExportPreviewDialogProps) {
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [editedSummary, setEditedSummary] = useState<string | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const generateSummary = useGeneratePitchSummary();
  const updateStatus = useUpdatePitchDraftStatus();
  const { exportToPdf, isGenerating: isPdfGenerating } = usePdfExport();

  // Generate summary when dialog opens
  useEffect(() => {
    if (open) {
      setEditedSummary(null);
      setIsEditingSummary(false);
      generateSummary.mutate({ pitchDraftId });
    }
    // Only trigger on open change, not on other dependency changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pitchDraftId]);

  // The summary to display/export - use edited version if set
  const displaySummary = editedSummary ?? generateSummary.data?.summary ?? '';

  const handleRetry = () => {
    generateSummary.reset();
    generateSummary.mutate({ pitchDraftId });
  };

  const handleExport = async () => {
    if (!pdfContentRef.current) return;

    const filename = `${pitchTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

    try {
      await exportToPdf(pdfContentRef.current, filename);
      // Update status to 'exported' after successful export
      updateStatus.mutate({ id: pitchDraftId, status: 'exported' });
      toast.success('PDF exported successfully', {
        description: `Saved as ${filename}`,
      });
      onOpenChange(false);
    } catch {
      // Error is handled by usePdfExport hook
    }
  };

  const handleSummaryEdit = () => {
    setEditedSummary(displaySummary);
    setIsEditingSummary(true);
  };

  const handleSummarySave = () => {
    setIsEditingSummary(false);
  };

  const isLoading = generateSummary.isPending;
  const hasError = generateSummary.isError;
  const hasSummary = generateSummary.isSuccess && generateSummary.data;
  const canExport = hasSummary && !isPdfGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="pitch-export-preview-dialog"
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>Export Pitch as PDF</DialogTitle>
          <DialogDescription>
            Preview your pitch with AI-generated executive summary before downloading.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Generating AI summary...</p>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive">
              {generateSummary.error?.message || 'Failed to generate summary'}
            </p>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Preview Content */}
        {hasSummary && (
          <>
            {/* Editable Summary Section */}
            <div className="border rounded-lg p-4 bg-blue-50/50" data-testid="summary-edit-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Executive Summary</h3>
                {isEditingSummary ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSummarySave}
                    className="h-8"
                    data-testid="save-summary-button"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Done
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSummaryEdit}
                    className="h-8"
                    data-testid="edit-summary-button"
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditingSummary ? (
                <Textarea
                  value={editedSummary ?? ''}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[80px] bg-white"
                  placeholder="Edit your executive summary..."
                  data-testid="summary-textarea"
                />
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="summary-display">
                  {displaySummary}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-auto border rounded-lg bg-muted/50 p-2">
              {/* Visible preview - scaled down */}
              <div className="transform scale-[0.5] origin-top-left w-[200%]">
                <PitchPdfExportContent
                  title={pitchTitle}
                  summary={displaySummary}
                  sections={sections}
                  competitorData={competitorData}
                  kelPosition={kelPosition}
                  marketGaps={marketGaps}
                />
              </div>
            </div>

            {/* Hidden full-size content for PDF export */}
            <div
              ref={pdfContentRef}
              className="fixed left-[-9999px] top-0"
              aria-hidden="true"
            >
              <PitchPdfExportContent
                title={pitchTitle}
                summary={displaySummary}
                sections={sections}
                competitorData={competitorData}
                kelPosition={kelPosition}
                marketGaps={marketGaps}
              />
            </div>
          </>
        )}

        {/* Footer with export button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
            data-testid="export-pdf-button"
          >
            {isPdfGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
