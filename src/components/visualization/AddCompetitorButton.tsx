import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface AddCompetitorButtonProps {
  onClick: () => void;
}

export function AddCompetitorButton({ onClick }: AddCompetitorButtonProps) {
  return (
    <Button
      onClick={onClick}
      data-testid="add-competitor-button"
      className="min-h-12 min-w-12 w-full whitespace-nowrap sm:w-auto gap-2"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add Competitor
    </Button>
  );
}
