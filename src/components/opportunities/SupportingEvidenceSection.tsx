'use client';

/**
 * SupportingEvidenceSection Component
 *
 * Displays supporting evidence for an opportunity with entity links.
 * Each evidence card shows entity type, relevance score, and excerpt.
 * Handles edge case where entity may not exist.
 */

import {
  Building2,
  FileText,
  Package,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { DetailSection } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { SupportingEvidence } from '@/lib/repositories/opportunities';
import type { Json } from '@/types/database';

/**
 * Icons for each entity type
 */
const ENTITY_ICONS: Record<SupportingEvidence['entity_type'], LucideIcon> = {
  company: Building2,
  product: Package,
  consumer: Users,
  trend: TrendingUp,
  research: FileText,
};

/**
 * Display labels for entity types
 */
const ENTITY_LABELS: Record<SupportingEvidence['entity_type'], string> = {
  company: 'Company',
  product: 'Product',
  consumer: 'Consumer',
  trend: 'Trend',
  research: 'Research',
};

/**
 * Get the URL for an entity based on type
 */
function getEntityUrl(
  entityType: SupportingEvidence['entity_type'],
  entityId: string
): string {
  const routes: Record<SupportingEvidence['entity_type'], string> = {
    company: '/market-intelligence/companies',
    product: '/market-intelligence/products',
    research: '/market-intelligence/research',
    // Consumer and trend map to research for now
    consumer: '/market-intelligence/research',
    trend: '/market-intelligence/research',
  };
  return `${routes[entityType]}/${entityId}`;
}

type SupportingEvidenceSectionProps = {
  /** Raw evidence array from opportunity (JSONB) */
  evidence: Json | null;
  /** Additional CSS classes */
  className?: string;
};

/**
 * Type guard to validate evidence item structure
 */
function isValidEvidence(item: unknown): item is SupportingEvidence {
  return (
    typeof item === 'object' &&
    item !== null &&
    'entity_type' in item &&
    'entity_id' in item &&
    'relevance_score' in item &&
    'excerpt' in item
  );
}

/**
 * Parse and validate evidence from JSONB
 */
function parseEvidence(evidence: Json | null): SupportingEvidence[] {
  if (!evidence) return [];
  if (!Array.isArray(evidence)) return [];

  // Filter and validate each item, then cast the result
  // The isValidEvidence guard ensures proper structure
  const validItems: SupportingEvidence[] = [];
  for (const item of evidence) {
    if (isValidEvidence(item)) {
      validItems.push(item);
    }
  }
  return validItems;
}

export function SupportingEvidenceSection({
  evidence,
  className,
}: SupportingEvidenceSectionProps) {
  const parsedEvidence = parseEvidence(evidence);

  return (
    <DetailSection title="Supporting Evidence" className={className}>
      {parsedEvidence.length === 0 ? (
        <p className="text-muted-foreground">No supporting evidence available</p>
      ) : (
        <div className="space-y-3" data-testid="supporting-evidence-list">
          {parsedEvidence.map((item, index) => {
            const Icon = ENTITY_ICONS[item.entity_type];
            const url = getEntityUrl(item.entity_type, item.entity_id);
            const relevancePercent = Math.round(item.relevance_score * 100);
            const hasEntityId = item.entity_id && item.entity_id.length > 0;

            if (hasEntityId) {
              return (
                <Link
                  key={`${item.entity_type}-${item.entity_id}-${index}`}
                  href={url}
                  className={cn(
                    'block min-h-[48px] rounded-lg p-3',
                    'bg-background border border-border',
                    'hover:bg-muted/50 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                  )}
                  data-testid={`evidence-card-${index}`}
                >
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0 flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {ENTITY_LABELS[item.entity_type]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {relevancePercent}% relevant
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.excerpt}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            }

            // Non-clickable fallback when entity doesn't exist
            return (
              <div
                key={`${item.entity_type}-missing-${index}`}
                className={cn(
                  'min-h-[48px] rounded-lg p-3',
                  'bg-muted/30 border border-border'
                )}
                data-testid={`evidence-card-unavailable-${index}`}
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-0 flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-md bg-muted/50">
                      <Icon className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {ENTITY_LABELS[item.entity_type]}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          (source unavailable)
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground/70 line-clamp-2">
                        {item.excerpt}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </DetailSection>
  );
}
