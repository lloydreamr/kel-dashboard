/**
 * DashboardGrid Component
 *
 * Responsive grid layout for the Market Intelligence dashboard.
 * Contains stats row and quick navigation section.
 */

import type { ReactNode } from 'react';

interface DashboardGridProps {
  /** Content for the stats row (3 stat cards) */
  statsContent: ReactNode;
  /** Content for the recent opportunities section */
  opportunitiesContent: ReactNode;
  /** Content for the quick navigation section */
  navContent: ReactNode;
}

export function DashboardGrid({
  statsContent,
  opportunitiesContent,
  navContent,
}: DashboardGridProps) {
  return (
    <div className="space-y-8" data-testid="mi-dashboard-grid">
      {/* Knowledge Coverage Stats */}
      <section aria-labelledby="stats-heading" data-testid="mi-stats-section">
        <h2 id="stats-heading" className="sr-only">
          Knowledge Coverage Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{statsContent}</div>
      </section>

      {/* Two-column layout for opportunities and navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Insights */}
        <section aria-labelledby="opportunities-heading">
          <h2 id="opportunities-heading" className="sr-only">
            Recent AI Insights
          </h2>
          {opportunitiesContent}
        </section>

        {/* Quick Navigation */}
        <section aria-labelledby="nav-heading" data-testid="mi-quick-nav-section">
          <h2 id="nav-heading" className="text-lg font-semibold mb-4">
            Quick Navigation
          </h2>
          <div className="space-y-3">{navContent}</div>
        </section>
      </div>
    </div>
  );
}
