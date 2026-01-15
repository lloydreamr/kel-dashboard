'use client';

/**
 * DashboardHeader Component
 *
 * Header for the Market Intelligence dashboard.
 * Shows title and last updated timestamp.
 */

import { formatDistanceToNow } from 'date-fns';

interface DashboardHeaderProps {
  /** Most recent update timestamp across all entities */
  lastUpdated: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  return (
    <header className="space-y-1" data-testid="mi-dashboard-header">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        Market Intelligence Dashboard
      </h1>
      {lastUpdated ? (
        <p className="text-sm text-muted-foreground">
          Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No data yet</p>
      )}
    </header>
  );
}
