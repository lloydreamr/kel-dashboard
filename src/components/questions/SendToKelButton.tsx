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
  hasRecommendation: boolean;
  onConfirm: () => void;
  isPending?: boolean;
}

export function SendToKelButton({
  hasRecommendation,
  onConfirm,
  isPending = false,
}: SendToKelButtonProps) {
  const buttonContent = (
    <Button
      data-testid="send-to-kel-button"
      disabled={!hasRecommendation || isPending}
      className="w-full"
    >
      {isPending ? 'Sending...' : 'Send to Kel'}
    </Button>
  );

  // Show tooltip when disabled
  if (!hasRecommendation) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>Add a recommendation first</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
