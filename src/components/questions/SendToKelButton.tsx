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
    <button
      data-testid="send-to-kel-button"
      disabled={!hasRecommendation || isPending}
      className={`w-full rounded-md px-4 py-3 min-h-[48px] text-sm font-medium transition-colors ${
        hasRecommendation
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-muted text-muted-foreground cursor-not-allowed'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      {isPending ? 'Sending...' : 'Send to Kel'}
    </button>
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
          <AlertDialogCancel className="min-h-[48px]">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="min-h-[48px]">
            Send
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
