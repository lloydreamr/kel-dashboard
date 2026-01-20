/**
 * Market Intelligence Visualization Page
 *
 * Integrates existing competitor positioning visualization into the
 * Market Intelligence section. Re-uses VisualizationPageClient from
 * the original route for single source of truth.
 *
 * @see Story 17.3: Existing Visualization Integration
 */

import { Suspense } from 'react';

import { ScatterChartSkeleton } from '@/components/visualization';
import { VisualizationPageClient } from '@/app/(dashboard)/visualization/VisualizationPageClient';

// ⚠️ EXCEPTION: Next.js App Router REQUIRES export default for page.tsx files
// This is the ONLY place where export default is allowed in this project
export default function MiVisualizationPage() {
  return (
    <Suspense
      fallback={
        <div
          data-testid="mi-visualization-loading"
          className="container py-6"
        >
          {/* Breadcrumb skeleton - matches MiBreadcrumb dimensions (min-h-[48px] mb-4) */}
          <div className="flex items-center min-h-[48px] mb-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4 mx-2 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="mb-6">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="bg-card rounded-lg border p-4">
            <ScatterChartSkeleton />
          </div>
        </div>
      }
    >
      <div data-testid="mi-visualization-page">
        <VisualizationPageClient showBreadcrumb />
      </div>
    </Suspense>
  );
}
