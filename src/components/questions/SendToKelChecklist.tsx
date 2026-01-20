/**
 * SendToKelChecklist Component
 *
 * Displays a visual checklist showing what's required before sending
 * a question to Kel. Each requirement shows as checked or unchecked.
 */

import { CheckCircle2, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SendToKelChecklistProps {
  hasEvidence: boolean;
  hasRecommendation: boolean;
  evidenceCount?: number;
}

interface ChecklistItemProps {
  label: string;
  isComplete: boolean;
  testId: string;
}

function ChecklistItem({ label, isComplete, testId }: ChecklistItemProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-center gap-2 text-sm',
        isComplete ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {isComplete ? (
        <CheckCircle2
          className="h-4 w-4 text-green-500 flex-shrink-0"
          data-testid={`${testId}-check`}
        />
      ) : (
        <Circle
          className="h-4 w-4 flex-shrink-0"
          data-testid={`${testId}-empty`}
        />
      )}
      <span>{label}</span>
    </div>
  );
}

export function SendToKelChecklist({
  hasEvidence,
  hasRecommendation,
  evidenceCount = 0,
}: SendToKelChecklistProps) {
  const isComplete = hasEvidence && hasRecommendation;

  // Don't show checklist if everything is complete
  if (isComplete) {
    return null;
  }

  return (
    <div
      data-testid="send-to-kel-checklist"
      className="rounded-md border border-border bg-muted/30 p-3 space-y-2"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Before sending to Kel:
      </p>
      <ChecklistItem
        testId="checklist-evidence"
        label={`Add evidence (${evidenceCount}/1 minimum)`}
        isComplete={hasEvidence}
      />
      <ChecklistItem
        testId="checklist-recommendation"
        label="Write a recommendation"
        isComplete={hasRecommendation}
      />
    </div>
  );
}
