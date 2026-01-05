import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DeleteCompetitorDialog } from './DeleteCompetitorDialog';
import { createMockCompetitor } from '@/test/factories';

// Use factory with minimal overrides for dialog tests
const mockCompetitor = createMockCompetitor({
  id: '1',
  name: 'Test Competitor',
  price_score: 7,
  quality_score: 8,
});

describe('DeleteCompetitorDialog', () => {
  it('shows competitor name in message', () => {
    render(
      <DeleteCompetitorDialog
        competitor={mockCompetitor}
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Remove Test Competitor from the chart/)).toBeInTheDocument();
  });

  it('calls onConfirm when delete button clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteCompetitorDialog
        competitor={mockCompetitor}
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const deleteButton = screen.getByTestId('competitor-delete-confirm');
    await user.click(deleteButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(
      <DeleteCompetitorDialog
        competitor={mockCompetitor}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByTestId('delete-competitor-dialog')).not.toBeInTheDocument();
  });
});
