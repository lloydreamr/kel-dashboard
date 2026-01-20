'use client';

/**
 * RecentOpportunities Component
 *
 * Displays top 3 AI-identified opportunities on the Market Intelligence dashboard.
 * Shows title, category badge, and confidence score for each opportunity.
 */

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Opportunity } from '@/lib/repositories/opportunities';

interface RecentOpportunitiesProps {
  /** Array of opportunities to display (max 3 shown) */
  opportunities: Opportunity[];
}

/**
 * Format category string for display
 * Converts snake_case to Title Case
 */
function formatCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get badge variant based on confidence score
 */
function getConfidenceBadgeVariant(score: number): 'default' | 'secondary' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'outline';
}

export function RecentOpportunities({ opportunities }: RecentOpportunitiesProps) {
  const displayOpportunities = opportunities.slice(0, 3);
  const hasOpportunities = displayOpportunities.length > 0;

  return (
    <Card data-testid="mi-recent-opportunities">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent AI Insights</CardTitle>
        {hasOpportunities && (
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/market-intelligence/opportunities"
              data-testid="mi-view-all-opportunities"
            >
              View All
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {hasOpportunities ? (
          <ul className="space-y-4" data-testid="mi-opportunities-list">
            {displayOpportunities.map((opportunity) => (
              <li
                key={opportunity.id}
                className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                data-testid={`mi-opportunity-item-${opportunity.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{opportunity.title}</p>
                  <Badge variant="secondary" className="mt-1">
                    {formatCategory(opportunity.category)}
                  </Badge>
                </div>
                <Badge
                  variant={getConfidenceBadgeVariant(opportunity.confidence_score)}
                  className="shrink-0"
                >
                  {opportunity.confidence_score}%
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="py-8 text-center text-sm text-muted-foreground"
            data-testid="mi-opportunities-empty"
          >
            <p>No AI insights yet.</p>
            <p className="mt-1">Add research data to generate opportunities.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
