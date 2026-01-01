/**
 * UpdateStaleButton Component
 *
 * Button to update stale question data by opening the edit form.
 * Only renders when the question data is stale (>14 days old).
 */

'use client';

import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { isStale } from '@/lib/utils/staleness';

interface UpdateStaleButtonProps {
  /** The updated_at timestamp to check for staleness */
  updatedAt: string | null | undefined;
  /** Callback when button is clicked to open edit form */
  onUpdate: () => void;
}

/**
 * Button for updating stale question data.
 *
 * Features:
 * - Conditional rendering: Only shows when data is stale
 * - Warning styling to match StaleDataBadge
 * - 48px touch target (handled by Button base styles)
 */
export function UpdateStaleButton({ updatedAt, onUpdate }: UpdateStaleButtonProps) {
  // Only render if data is stale
  if (!isStale(updatedAt)) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="min-h-[48px] gap-2 text-warning border-warning/30 hover:bg-warning/10"
      data-testid="update-stale-button"
      onClick={onUpdate}
    >
      <Pencil className="h-4 w-4" />
      <span>Update</span>
    </Button>
  );
}
