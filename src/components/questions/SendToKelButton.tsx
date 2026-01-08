'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SendToKelButtonProps {
  hasEvidence: boolean;
  hasRecommendation: boolean;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Get explanation text for why the button is disabled
 */
function getDisabledReason(hasEvidence: boolean, hasRecommendation: boolean): string {
  if (!hasEvidence && !hasRecommendation) {
    return 'Add evidence and a recommendation first';
  }
  if (!hasEvidence) {
    return 'Add evidence first';
  }
  if (!hasRecommendation) {
    return 'Add a recommendation first';
  }
  return '';
}

export function SendToKelButton({
  hasEvidence,
  hasRecommendation,
  onConfirm,
  isPending = false,
}: SendToKelButtonProps) {
  const isEnabled = hasEvidence && hasRecommendation;
  const disabledReason = getDisabledReason(hasEvidence, hasRecommendation);

  const buttonContent = (
    <Button
      data-testid="send-to-kel-button"
      disabled={!isEnabled || isPending}
      className="w-full"
    >
      {isPending ? 'Sending...' : 'Send to Kel'}
    </Button>
  );

  // Show tooltip with explanation when disabled
  if (!isEnabled) {
    return (
      <div className="space-y-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent>
              <p>{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p
          data-testid="send-to-kel-helper"
          className="text-xs text-muted-foreground text-center"
        >
          {disabledReason}
        </p>
      </div>
    );
  }

  // Show AlertDialog when enabled
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{buttonContent}</AlertDialogTrigger>
      <AlertDialogContent data-testid="send-to-kel-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Send to Kel?</AlertDialogTitle>
          <AlertDialogDescription>
            He will see this in his decision queue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Send
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
