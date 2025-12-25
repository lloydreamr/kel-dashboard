'use client';

import { useState } from 'react';

import { EvidenceForm } from './EvidenceForm';

interface EvidenceSectionProps {
  questionId: string;
  userId: string;
  /** Whether the user can add evidence (Maho only) */
  canAdd: boolean;
}

/**
 * Evidence section for question detail page.
 * Shows "Add Evidence" button that expands to inline form.
 */
export function EvidenceSection({
  questionId,
  userId,
  canAdd,
}: EvidenceSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  if (!canAdd) {
    return null;
  }

  return (
    <div className="mt-4">
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          data-testid="add-evidence-button"
          aria-label="Add evidence to this question"
          className="w-full rounded-md border-2 border-dashed border-border bg-background px-4 py-4 min-h-[48px] text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          + Add Evidence
        </button>
      )}

      {isAdding && (
        <EvidenceForm
          questionId={questionId}
          userId={userId}
          onCancel={() => setIsAdding(false)}
          onSuccess={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}
