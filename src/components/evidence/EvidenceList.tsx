'use client';

import { EvidenceEmptyState } from './EvidenceEmptyState';
import { EvidenceItem } from './EvidenceItem';
import { EvidenceListSkeleton } from './EvidenceListSkeleton';

import type { Evidence } from '@/types/evidence';

interface EvidenceListProps {
  evidence: Evidence[] | undefined;
  isLoading: boolean;
  /** User role for empty state message */
  role: 'maho' | 'kel';
  /** Called when an evidence item is clicked */
  onItemClick?: (evidence: Evidence) => void;
  /** Called when edit button is clicked on an evidence item */
  onEditClick?: (evidence: Evidence) => void;
  /** Called when remove button is clicked on an evidence item */
  onRemoveClick?: (evidence: Evidence) => void;
}

/**
 * Evidence list container with loading, empty, and populated states.
 * Renders numbered list of evidence items below recommendation.
 */
export function EvidenceList({
  evidence,
  isLoading,
  role,
  onItemClick,
  onEditClick,
  onRemoveClick,
}: EvidenceListProps) {
  const canModify = role === 'maho';

  // Loading state
  if (isLoading) {
    return <EvidenceListSkeleton />;
  }

  // Empty state
  if (!evidence || evidence.length === 0) {
    return <EvidenceEmptyState role={role} />;
  }

  // Populated state
  return (
    <div data-testid="evidence-list" className="space-y-3">
      {evidence.map((item, index) => (
        <EvidenceItem
          key={item.id}
          evidence={item}
          number={index + 1}
          onClick={() => onItemClick?.(item)}
          canModify={canModify}
          onEdit={() => onEditClick?.(item)}
          onRemove={() => onRemoveClick?.(item)}
        />
      ))}
    </div>
  );
}
