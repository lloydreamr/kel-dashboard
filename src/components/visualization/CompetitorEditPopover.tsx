'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { CompetitorDataPoint } from '@/types';

interface CompetitorEditPopoverProps {
  competitor: CompetitorDataPoint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorPoint: { x: number; y: number };
  onEdit: () => void;
  onDelete: () => void;
}

export function CompetitorEditPopover({
  competitor,
  open,
  onOpenChange,
  anchorPoint,
  onEdit,
  onDelete,
}: CompetitorEditPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* Positioned anchor at click coordinates */}
        <div
          style={{
            position: 'fixed',
            left: `${anchorPoint.x}px`,
            top: `${anchorPoint.y}px`,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        data-testid="competitor-edit-popover"
        className="w-64"
        align="start"
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">{competitor.name}</h4>
            <p className="text-sm text-muted-foreground">
              Price: {competitor.price_score} | Quality: {competitor.quality_score}
            </p>
          </div>
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
      </PopoverContent>
    </Popover>
  );
}
