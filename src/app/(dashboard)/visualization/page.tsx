import { Suspense } from 'react';

import { ScatterChartSkeleton } from '@/components/visualization';

import { VisualizationPageClient } from './VisualizationPageClient';

/**
 * Competitor Positioning Visualization Page
 *
 * Wrapper page with Suspense boundary required for useSearchParams
 * in Next.js 15 (App Router strict mode).
 *
 * Story 11.1: Pitch Mode View - supports ?mode=pitch query param
 *
 * @see Story 6.8: Performance Optimization (NFR3: < 1 second render)
 */

// ⚠️ EXCEPTION: Next.js App Router REQUIRES export default for page.tsx files
// This is the ONLY place where export default is allowed in this project
export default function VisualizationPage() {
  return (
    <Suspense
      fallback={
        <div data-testid="visualization-page-loading" className="container py-6">
          <div className="mb-6">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="bg-card rounded-lg border p-4">
            <ScatterChartSkeleton />
          </div>
        </div>
      }
    >
      <VisualizationPageClient />
    </Suspense>
  );
}
