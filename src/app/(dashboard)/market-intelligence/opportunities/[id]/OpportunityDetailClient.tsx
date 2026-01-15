'use client';

/**
 * OpportunityDetailClient Component
 *
 * Client component for opportunity detail page.
 * Fetches opportunity data and renders the detail view with:
 * - Header with title and category badge
 * - Description section
 * - Confidence score with level indicator
 * - Supporting evidence with entity links
 * - Metadata (status, dates)
 * - Actions (Mark as Actionable)
 */

import {
  OpportunityActions,
  SupportingEvidenceSection,
} from '@/components/opportunities';
import {
  DetailPageHeader,
  DetailPageSkeleton,
  DetailSection,
  EntityNotFound,
} from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { useOpportunity } from '@/hooks/opportunities';
import {
  getConfidenceLevel,
  OPPORTUNITY_CATEGORY_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  CONFIDENCE_COLORS,
} from '@/types';

import type { OpportunityCategoryFilterKey, OpportunityStatusFilterKey } from '@/types';

type OpportunityDetailClientProps = {
  id: string;
};

/**
 * Format date string for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get badge variant based on status
 */
function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'actionable':
      return 'default';
    case 'reviewing':
      return 'secondary';
    case 'dismissed':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function OpportunityDetailClient({ id }: OpportunityDetailClientProps) {
  const { data: opportunity, isLoading, error } = useOpportunity(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !opportunity) {
    return (
      <EntityNotFound
        entityType="Opportunity"
        backHref="/market-intelligence/opportunities"
        backLabel="Browse Opportunities"
      />
    );
  }

  const confidenceLevel = getConfidenceLevel(opportunity.confidence_score);
  const confidencePercent = Math.round(opportunity.confidence_score * 100);

  // Get display labels
  const categoryLabel =
    opportunity.category && opportunity.category in OPPORTUNITY_CATEGORY_LABELS
      ? OPPORTUNITY_CATEGORY_LABELS[opportunity.category as OpportunityCategoryFilterKey]
      : opportunity.category ?? 'Unknown';

  const statusLabel =
    opportunity.status && opportunity.status in OPPORTUNITY_STATUS_LABELS
      ? OPPORTUNITY_STATUS_LABELS[opportunity.status as OpportunityStatusFilterKey]
      : opportunity.status ?? 'Unknown';

  return (
    <div className="space-y-6 max-w-4xl" data-testid="opportunity-detail">
      {/* Header with back button, title, and category badge */}
      <DetailPageHeader
        title={opportunity.title}
        backHref="/market-intelligence/opportunities"
        backLabel="Opportunities"
        badge={categoryLabel}
        badgeVariant="secondary"
      />

      {/* Description Section - expanded by default */}
      <DetailSection title="Description" defaultExpanded={true}>
        <p className="text-muted-foreground">
          {opportunity.description || 'No description available'}
        </p>
      </DetailSection>

      {/* Confidence Score */}
      <DetailSection title="Confidence" defaultExpanded={true}>
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold capitalize ${CONFIDENCE_COLORS[confidenceLevel]}`}
            data-testid="confidence-level"
          >
            {confidenceLevel}
          </span>
          <span className="text-muted-foreground" data-testid="confidence-percent">
            ({confidencePercent}%)
          </span>
        </div>
      </DetailSection>

      {/* Supporting Evidence */}
      <SupportingEvidenceSection evidence={opportunity.supporting_evidence} />

      {/* Metadata Section - collapsed on mobile by default */}
      <DetailSection title="Details" defaultExpanded={false}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <Badge
                variant={getStatusVariant(opportunity.status)}
                data-testid="opportunity-status-badge"
              >
                {statusLabel}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Generated</dt>
            <dd className="mt-1 text-sm" data-testid="generated-date">
              {formatDate(opportunity.generated_at)}
            </dd>
          </div>
          {opportunity.reviewed_at && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Reviewed</dt>
              <dd className="mt-1 text-sm" data-testid="reviewed-date">
                {formatDate(opportunity.reviewed_at)}
              </dd>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Actions */}
      <OpportunityActions opportunity={opportunity} />
    </div>
  );
}
