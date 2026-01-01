'use client';

import { useMemo, useState } from 'react';

import { ScatterChart, AddCompetitorButton, CompetitorDialog, DeleteCompetitorDialog, MarkKelPositionButton, KelPositionDialog, ChartLegend, ScatterChartSkeleton } from '@/components/visualization';
import { useProfile } from '@/hooks/auth';
import { useDeleteCompetitor, useCompetitorData } from '@/hooks/competitors';

import type { CompetitorDataPoint } from '@/types';

/**
 * Competitor Positioning Visualization Page
 *
 * Displays a scatter chart showing competitor positioning based on
 * price and quality scores. Client component with add/edit/delete dialogs.
 *
 * Performance: Data is prefetched in layout.tsx and hydrated via HydrationBoundary.
 * @see Story 6.8: Performance Optimization (NFR3: < 1 second render)
 */

// ⚠️ EXCEPTION: Next.js App Router REQUIRES export default for page.tsx files
// This is the ONLY place where export default is allowed in this project
export default function VisualizationPage() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const isMaho = profile?.role === 'maho';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [deletingCompetitor, setDeletingCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [kelDialogOpen, setKelDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const deleteMutation = useDeleteCompetitor();
  const { data: competitors, isLoading: competitorsLoading } = useCompetitorData();

  // Find existing Kel position for conditional button text
  const existingKelPosition = competitors?.find((c) => c.is_kel_position);
  const hasKelPosition = !!existingKelPosition;

  // Memoize category extraction to avoid recalculation on every render
  const categories = useMemo(
    () => [...new Set(competitors?.map((c) => c.category).filter(Boolean))] as string[],
    [competitors]
  );

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

  return (
    <div data-testid="visualization-page" className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Competitor Positioning</h1>
        {isMaho && (
          <div className="flex gap-3">
            <MarkKelPositionButton
              onClick={() => setKelDialogOpen(true)}
              hasExistingPosition={hasKelPosition}
            />
            <AddCompetitorButton onClick={handleAddClick} />
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border p-4">
        <ScatterChart
          isMaho={isMaho}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
        <ChartLegend
          hasKelPosition={hasKelPosition}
          categories={categories.length > 0 ? categories : undefined}
          selectedCategory={selectedCategory}
          onCategoryClick={setSelectedCategory}
          isLoading={competitorsLoading}
        />
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
