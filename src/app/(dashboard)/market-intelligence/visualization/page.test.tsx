/**
 * Market Intelligence Visualization Page Tests
 *
 * Tests the MI visualization page (/market-intelligence/visualization).
 * Verifies page renders, passes showBreadcrumb prop, and has correct test IDs.
 *
 * @see Story 17.3: Existing Visualization Integration
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock VisualizationPageClient component
vi.mock('@/app/(dashboard)/visualization/VisualizationPageClient', () => ({
  VisualizationPageClient: ({ showBreadcrumb }: { showBreadcrumb?: boolean }) => (
    <div data-testid="visualization-page-client-mock">
      {showBreadcrumb && <div data-testid="breadcrumb-enabled">Breadcrumb</div>}
    </div>
  ),
}));

// Mock ScatterChartSkeleton for Suspense fallback
vi.mock('@/components/visualization', () => ({
  ScatterChartSkeleton: () => <div data-testid="scatter-chart-skeleton">Loading...</div>,
}));

// Import the page component (default export required by Next.js)
import MiVisualizationPage from './page';

describe('MiVisualizationPage', () => {
  it('renders the page with correct test ID wrapper', () => {
    render(<MiVisualizationPage />);

    expect(screen.getByTestId('mi-visualization-page')).toBeInTheDocument();
  });

  it('renders VisualizationPageClient component', () => {
    render(<MiVisualizationPage />);

    expect(screen.getByTestId('visualization-page-client-mock')).toBeInTheDocument();
  });

  it('passes showBreadcrumb prop to VisualizationPageClient', () => {
    render(<MiVisualizationPage />);

    // The mock renders a "breadcrumb-enabled" element when showBreadcrumb=true
    expect(screen.getByTestId('breadcrumb-enabled')).toBeInTheDocument();
  });
});
