'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  ScatterChart,
  AddCompetitorButton,
  CompetitorDialog,
  DeleteCompetitorDialog,
  MarkKelPositionButton,
  KelPositionDialog,
  ChartLegend,
  ChartFilters,
  ChartStatsBar,
  ScatterChartSkeleton,
  EnterPitchModeButton,
  PdfExportContent,
  PitchCompetitorTable,
  ComparisonPanel,
  SmartInsightsPanel,
  ChartAxisSelector,
  DEFAULT_AXIS_CONFIG,
} from '@/components/visualization';
import type { ChartFiltersValue, ChartAxisConfig } from '@/components/visualization';
import { MiBreadcrumb } from '@/components/market-intelligence';
import { useProfile } from '@/hooks/auth';
import { useDeleteCompetitor, useCompetitorData } from '@/hooks/competitors';
import { usePdfExport } from '@/hooks/visualization/usePdfExport';
import { usePitchMode } from '@/hooks/visualization/usePitchMode';
import { usePitchModeStore } from '@/stores/pitchMode';

import type { CompetitorDataPoint } from '@/types';

/**
 * Props for VisualizationPageClient
 *
 * @property showBreadcrumb - When true, renders MiBreadcrumb above the page title
 *   Used when accessed via /market-intelligence/visualization route
 */
interface VisualizationPageClientProps {
  showBreadcrumb?: boolean;
}

/**
 * Competitor Positioning Visualization Page Client
 *
 * Displays a scatter chart showing competitor positioning based on
 * price and quality scores. Client component with add/edit/delete dialogs.
 *
 * Story 11.1: Pitch Mode View
 * - Supports pitch mode via URL query param (?mode=pitch)
 * - Shows clean presentation view for distributor meetings
 *
 * Story 17.3: Market Intelligence Integration
 * - showBreadcrumb prop enables MI context breadcrumb navigation
 *
 * Performance: Data is prefetched in layout.tsx and hydrated via HydrationBoundary.
 * @see Story 6.8: Performance Optimization (NFR3: < 1 second render)
 */
export function VisualizationPageClient({
  showBreadcrumb = false,
}: VisualizationPageClientProps) {
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const isMaho = profile?.role === 'maho';

  // Pitch mode state from URL (synced to Zustand store for layout visibility)
  // Note: exitPitchMode is handled by DashboardContent (layout wrapper)
  const { isPitchMode, enterPitchMode } = usePitchMode();

  // PDF export setup (Story 11.2)
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const { exportToPdf } = usePdfExport();
  const registerPdfDownload = usePitchModeStore((s) => s.registerPdfDownload);
  const unregisterPdfDownload = usePitchModeStore((s) => s.unregisterPdfDownload);
  const setIsGeneratingPdf = usePitchModeStore((s) => s.setIsGeneratingPdf);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [deletingCompetitor, setDeletingCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [kelDialogOpen, setKelDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ChartFiltersValue>({ category: null, channel: null });
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [axisConfig, setAxisConfig] = useState<ChartAxisConfig>(DEFAULT_AXIS_CONFIG);

  const deleteMutation = useDeleteCompetitor();
  const { data: competitors, isLoading: competitorsLoading } = useCompetitorData();

  // Find existing Kel position for conditional button text
  const existingKelPosition = competitors?.find((c) => c.is_kel_position);
  const hasKelPosition = !!existingKelPosition;

  // Check if any competitor has market share data (for bubble legend)
  const hasMarketShareData = competitors?.some((c) => c.market_share_percent != null) ?? false;

  // Apply filters to competitors (UX: Always show Kel position even when filtered out)
  const filteredCompetitors = useMemo(() => {
    if (!competitors) return [];

    return competitors.filter((c) => {
      // Always show Kel position regardless of filters
      if (c.is_kel_position) return true;

      // Category filter
      if (filters.category && c.category !== filters.category) {
        return false;
      }

      // Channel filter (check if competitor has this channel in their primary_channels array)
      if (filters.channel && c.primary_channels) {
        if (!c.primary_channels.includes(filters.channel)) {
          return false;
        }
      } else if (filters.channel && !c.primary_channels) {
        // If filtering by channel but competitor has no channel data, hide them
        return false;
      }

      return true;
    });
  }, [competitors, filters]);

  // Derive selected competitors for comparison panel
  const selectedCompetitors = useMemo(() => {
    if (!competitors) return [];
    return competitors.filter((c) => selectedForComparison.includes(c.id) && !c.is_kel_position);
  }, [competitors, selectedForComparison]);

  // Comparison mode handlers
  const handleToggleComparison = useCallback((id: string) => {
    setSelectedForComparison((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  }, []);

  const handleRemoveFromComparison = useCallback((id: string) => {
    setSelectedForComparison((prev) => prev.filter((cid) => cid !== id));
  }, []);

  const handleClearComparison = useCallback(() => {
    setSelectedForComparison([]);
  }, []);

  // PDF download handler (Story 11.2)
  // Uses useCallback to maintain stable reference for Zustand registration
  const handleDownloadPdf = useCallback(async () => {
    if (!pdfContentRef.current) return;
    const filename = `kel-positioning-${new Date().toISOString().split('T')[0]}.pdf`;
    setIsGeneratingPdf(true);
    try {
      await exportToPdf(pdfContentRef.current, filename);
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [exportToPdf, setIsGeneratingPdf]);

  // Register PDF download callback with Zustand store when in pitch mode
  // This bridges the gap between this page (has data) and DashboardContent (renders header)
  useEffect(() => {
    if (isPitchMode) {
      registerPdfDownload(handleDownloadPdf);
      return () => {
        unregisterPdfDownload();
      };
    }
  }, [isPitchMode, handleDownloadPdf, registerPdfDownload, unregisterPdfDownload]);

  const handleAddClick = () => {
    setEditingCompetitor(null);
    setDialogOpen(true);
  };

  const handleEditClick = (competitor: CompetitorDataPoint) => {
    setEditingCompetitor(competitor);
    setDialogOpen(true);
  };

  const handleDeleteClick = (competitor: CompetitorDataPoint) => {
    setDeletingCompetitor(competitor);
  };

  const handleDeleteConfirm = () => {
    if (deletingCompetitor) {
      deleteMutation.mutate(deletingCompetitor.id);
      setDeletingCompetitor(null);
    }
  };

  // Loading state - show skeleton for progressive loading (AC2)
  // With server prefetch, this should rarely trigger (data hydrated from server)
  if (profileLoading) {
    return (
      <div data-testid="visualization-page" className="container py-6">
        <div className="mb-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="bg-card rounded-lg border p-4">
          <ScatterChartSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div data-testid="visualization-page" className="container py-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load user profile</p>
            <p className="text-sm text-muted-foreground">Please refresh the page or sign in again</p>
          </div>
        </div>
      </div>
    );
  }

  // Pitch Mode: Clean presentation view (AC1, AC3)
  // Note: PitchModeHeader is rendered by DashboardContent (layout wrapper)
  // to avoid duplication. This page only renders the chart content.
  // INTENTIONAL: Breadcrumb is hidden in pitch mode for clean presentation view.
  if (isPitchMode) {
    return (
      <>
        <div data-testid="visualization-page" className="container py-6">
          <div data-testid="print-preview-content" className="bg-card rounded-lg border p-4">
            <ScatterChart
              isMaho={isMaho}
              isPitchMode={true}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              onAddClick={handleAddClick}
            />
            <ChartLegend hasKelPosition={hasKelPosition} isLoading={competitorsLoading} hasMarketShareData={hasMarketShareData} />
          </div>

          {/* Competitor Comparison Table (Story 11.4) */}
          <div className="mt-6">
            <PitchCompetitorTable
              competitors={competitors ?? []}
              kelPosition={existingKelPosition ?? null}
            />
          </div>
        </div>

        {/* Hidden PDF content for export (Story 11.2)
            MUST use position:fixed off-screen, NOT display:none
            html2canvas requires visible DOM to capture */}
        <div
          ref={pdfContentRef}
          className="fixed left-[-9999px] top-0"
          aria-hidden="true"
        >
          <PdfExportContent
            competitors={competitors ?? []}
            kelPosition={existingKelPosition ?? null}
          />
        </div>
      </>
    );
  }

  // Normal view with edit controls
  return (
    <div data-testid="visualization-page" className="container py-6">
      {showBreadcrumb && <MiBreadcrumb current="Visualization" />}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Competitor Positioning</h1>
        <div className="flex flex-wrap gap-3">
          <EnterPitchModeButton onClick={enterPitchMode} />
          {isMaho && (
            <>
              <MarkKelPositionButton
                onClick={() => setKelDialogOpen(true)}
                hasExistingPosition={hasKelPosition}
              />
              <AddCompetitorButton onClick={handleAddClick} />
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4">
        <ChartStatsBar competitors={competitors ?? []} />
        <ChartFilters
          value={filters}
          onChange={setFilters}
          filteredCount={filteredCompetitors.filter(c => !c.is_kel_position).length}
          totalCount={competitors?.filter(c => !c.is_kel_position).length ?? 0}
        />
        {/* Phase 3: Flexible Views - Axis selector with preset views */}
        <div className="mb-4 pb-3 border-b border-border">
          <ChartAxisSelector
            value={axisConfig}
            onChange={setAxisConfig}
            compact={true}
          />
        </div>
        <ScatterChart
          isMaho={isMaho}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onAddClick={handleAddClick}
          competitors={filteredCompetitors}
          selectedForComparison={selectedForComparison}
          onToggleComparison={handleToggleComparison}
          axisConfig={axisConfig}
        />
        <ChartLegend hasKelPosition={hasKelPosition} isLoading={competitorsLoading} hasMarketShareData={hasMarketShareData} />
      </div>

      {/* Smart Insights Panel - auto-generated strategic intelligence */}
      <div className="mt-6">
        <SmartInsightsPanel
          competitors={competitors ?? []}
          kelPosition={existingKelPosition ?? null}
          maxInsights={4}
        />
      </div>

      {/* Comparison Panel - shows selected competitors side-by-side */}
      <ComparisonPanel
        competitors={selectedCompetitors}
        kelPosition={existingKelPosition ?? null}
        onRemove={handleRemoveFromComparison}
        onClearAll={handleClearComparison}
      />

      {/* Add/Edit Dialog */}
      <CompetitorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCompetitor={editingCompetitor}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCompetitorDialog
        competitor={deletingCompetitor}
        open={!!deletingCompetitor}
        onOpenChange={(open) => {
          if (!open) setDeletingCompetitor(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Kel Position Dialog */}
      <KelPositionDialog
        open={kelDialogOpen}
        onOpenChange={setKelDialogOpen}
        existingPosition={existingKelPosition}
      />
    </div>
  );
}
