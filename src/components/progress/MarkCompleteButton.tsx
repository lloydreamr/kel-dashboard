'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/auth';
import { useMarkMilestoneComplete } from '@/hooks/milestones';

import { MarkCompleteDialog } from './MarkCompleteDialog';

import type { Milestone } from '@/types';

interface MarkCompleteButtonProps {
  milestone: Milestone;
}

export function MarkCompleteButton({ milestone }: MarkCompleteButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const markComplete = useMarkMilestoneComplete();

  // Don't render while profile is loading
  if (profileLoading) {
    return null;
  }

  // Only Maho can mark complete (AC4)
  const isMaho = profile?.role === 'maho';

  // Don't show if not Maho, already complete (AC3), or not in progress
  if (!isMaho || milestone.status !== 'in_progress') {
    return null;
  }

  const handleConfirm = () => {
    if (!profile?.id) return;

    markComplete.mutate(
      { id: milestone.id, userId: profile.id },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success('Milestone marked complete');
        },
        onError: () => {
          setDialogOpen(false);
          toast.error('Failed to mark milestone complete. Please try again.');
        },
      }
    );
  };

  return (
    <>
      <Button
        data-testid="mark-milestone-complete-button"
        variant="default"
        className="min-h-12 w-full"
        onClick={() => setDialogOpen(true)}
        disabled={markComplete.isPending}
      >
        {markComplete.isPending ? 'Processing...' : 'Mark Complete'}
      </Button>
      <MarkCompleteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={milestone.category}
        onConfirm={handleConfirm}
        isPending={markComplete.isPending}
      />
    </>
  );
}
