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
      className="min-h-[48px] min-w-[48px] w-full whitespace-nowrap sm:w-auto"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Competitor
    </Button>
  );
}
