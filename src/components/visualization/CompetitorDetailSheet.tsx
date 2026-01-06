'use client';

/**
 * @fileoverview Responsive competitor detail modal/popover
 *
 * Renders different UI based on viewport:
 * - Mobile (< 640px): Bottom sheet with swipe-to-dismiss
 * - Desktop (>= 640px): Standard popover at click position
 *
 * Story 10.2: Mobile Touch Interactions
 *
 * @example
 * <CompetitorDetailSheet
 *   competitor={selectedCompetitor}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   anchorPoint={{ x: 100, y: 200 }}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   isMobile={isMobile}
 * />
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CompetitorEditPopover } from './CompetitorEditPopover';
import { SwipeableSheetContent } from './SwipeableSheetContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { CompetitorDataPoint } from '@/types';

interface CompetitorDetailSheetProps {
  /** The competitor data to display */
  competitor: CompetitorDataPoint;
  /** Whether the sheet/popover is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Anchor point for desktop popover positioning */
  anchorPoint: { x: number; y: number };
  /** Callback when Edit button is clicked */
  onEdit: () => void;
  /** Callback when Delete button is clicked */
  onDelete: () => void;
  /** Whether to render mobile bottom sheet (true) or desktop popover (false) */
  isMobile: boolean;
}

export function CompetitorDetailSheet({
  competitor,
  open,
  onOpenChange,
  anchorPoint,
  onEdit,
  onDelete,
  isMobile,
}: CompetitorDetailSheetProps) {
  // Desktop: use existing popover for backwards compatibility
  if (!isMobile) {
    return (
      <CompetitorEditPopover
        competitor={competitor}
        open={open}
        onOpenChange={onOpenChange}
        anchorPoint={anchorPoint}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  // Mobile: use bottom sheet with swipe-to-dismiss
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="viz-competitor-modal-mobile"
        className="rounded-t-xl"
      >
        <SwipeableSheetContent onDismiss={() => onOpenChange(false)}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {competitor.name}
              {competitor.is_kel_position && (
                <Badge variant="secondary" data-testid="kel-badge">
                  Kel
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Score display grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Price Score</span>
                <p className="text-lg font-semibold" data-testid="price-score">
                  {competitor.price_score}/10
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Quality Score</span>
                <p className="text-lg font-semibold" data-testid="quality-score">
                  {competitor.quality_score}/10
                </p>
              </div>
            </div>

            {/* Action buttons - 48px min-height for touch targets */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  onEdit();
                  onOpenChange(false);
                }}
                data-testid="competitor-edit-button"
                className="min-h-[48px] w-full"
              >
                Edit
              </Button>
              <Button
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
                variant="destructive"
                data-testid="competitor-delete-button"
                className="min-h-[48px] w-full"
              >
                Delete
              </Button>
            </div>
          </div>
        </SwipeableSheetContent>
      </SheetContent>
    </Sheet>
  );
}
