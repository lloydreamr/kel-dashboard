'use client';

import { useState } from 'react';

import {
  ScatterChart,
  AddCompetitorButton,
  CompetitorDialog,
  DeleteCompetitorDialog,
  MarkKelPositionButton,
  KelPositionDialog,
  ChartLegend,
  ScatterChartSkeleton,
  EnterPitchModeButton,
} from '@/components/visualization';
import { useProfile } from '@/hooks/auth';
import { useDeleteCompetitor, useCompetitorData } from '@/hooks/competitors';
import { usePitchMode } from '@/hooks/visualization/usePitchMode';

import type { CompetitorDataPoint } from '@/types';

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
 * Performance: Data is prefetched in layout.tsx and hydrated via HydrationBoundary.
 * @see Story 6.8: Performance Optimization (NFR3: < 1 second render)
 */
export function VisualizationPageClient() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const isMaho = profile?.role === 'maho';

  // Pitch mode state from URL (synced to Zustand store for layout visibility)
  // Note: exitPitchMode is handled by DashboardContent (layout wrapper)
  const { isPitchMode, enterPitchMode } = usePitchMode();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [deletingCompetitor, setDeletingCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [kelDialogOpen, setKelDialogOpen] = useState(false);

  const deleteMutation = useDeleteCompetitor();
  const { data: competitors, isLoading: competitorsLoading } = useCompetitorData();

  // Find existing Kel position for conditional button text
  const existingKelPosition = competitors?.find((c) => c.is_kel_position);
  const hasKelPosition = !!existingKelPosition;

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
  if (isPitchMode) {
    return (
      <div data-testid="visualization-page" className="container py-6">
        <div className="bg-card rounded-lg border p-4">
          <ScatterChart
            isMaho={isMaho}
            isPitchMode={true}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onAddClick={handleAddClick}
          />
          <ChartLegend hasKelPosition={hasKelPosition} isLoading={competitorsLoading} />
        </div>
      </div>
    );
  }

  // Normal view with edit controls
  return (
    <div data-testid="visualization-page" className="container py-6">
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
        <ScatterChart
          isMaho={isMaho}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onAddClick={handleAddClick}
        />
        <ChartLegend hasKelPosition={hasKelPosition} isLoading={competitorsLoading} />
      </div>

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
