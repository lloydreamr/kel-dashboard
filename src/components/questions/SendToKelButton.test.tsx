import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SendToKelButton } from './SendToKelButton';

describe('SendToKelButton', () => {
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with correct test ID', () => {
    render(
      <SendToKelButton
        hasEvidence
        hasRecommendation
        onConfirm={mockOnConfirm}
      />
    );
    expect(screen.getByTestId('send-to-kel-button')).toBeInTheDocument();
  });

  describe('button disabled states', () => {
    it('disables button when hasEvidence is false and hasRecommendation is false', () => {
      render(
        <SendToKelButton
          hasEvidence={false}
          hasRecommendation={false}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-button')).toBeDisabled();
    });

    it('disables button when hasEvidence is false and hasRecommendation is true', () => {
      render(
        <SendToKelButton
          hasEvidence={false}
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-button')).toBeDisabled();
    });

    it('disables button when hasEvidence is true and hasRecommendation is false', () => {
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation={false}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-button')).toBeDisabled();
    });

    it('enables button when hasEvidence is true and hasRecommendation is true', () => {
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-button')).toBeEnabled();
    });
  });

  describe('helper text and tooltips', () => {
    it('shows helper text when both evidence and recommendation missing', () => {
      render(
        <SendToKelButton
          hasEvidence={false}
          hasRecommendation={false}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-helper')).toHaveTextContent(
        'Add evidence and a recommendation first'
      );
    });

    it('shows helper text when only evidence is missing', () => {
      render(
        <SendToKelButton
          hasEvidence={false}
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-helper')).toHaveTextContent(
        'Add evidence first'
      );
    });

    it('shows helper text when only recommendation is missing', () => {
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation={false}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('send-to-kel-helper')).toHaveTextContent(
        'Add a recommendation first'
      );
    });

    it('does not show helper text when button is enabled', () => {
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.queryByTestId('send-to-kel-helper')).not.toBeInTheDocument();
    });

    it('shows tooltip when button is disabled', async () => {
      const user = userEvent.setup();
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation={false}
          onConfirm={mockOnConfirm}
        />
      );

      await user.hover(screen.getByTestId('send-to-kel-button'));

      await waitFor(() => {
        // Radix tooltip renders multiple elements with the same text for a11y
        // Use getAllByText and check that at least one is present
        const tooltipTexts = screen.getAllByText('Add a recommendation first');
        expect(tooltipTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('confirmation dialog', () => {
    it('opens dialog when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByTestId('send-to-kel-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('send-to-kel-confirm-dialog')
        ).toBeInTheDocument();
      });
    });

    it('shows correct dialog text', async () => {
      const user = userEvent.setup();
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByTestId('send-to-kel-button'));

      await waitFor(() => {
        expect(screen.getByText('Send to Kel?')).toBeInTheDocument();
        expect(
          screen.getByText('He will see this in his decision queue.')
        ).toBeInTheDocument();
      });
    });

    it('calls onConfirm when dialog is confirmed', async () => {
      const user = userEvent.setup();
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByTestId('send-to-kel-button'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when dialog is cancelled', async () => {
      const user = userEvent.setup();
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByTestId('send-to-kel-button'));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Cancel' })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('pending state', () => {
    it('shows loading text when isPending is true', () => {
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
          isPending
        />
      );
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('disables button when isPending is true', () => {
      render(
        <SendToKelButton
          hasEvidence
          hasRecommendation
          onConfirm={mockOnConfirm}
          isPending
        />
      );
      expect(screen.getByTestId('send-to-kel-button')).toBeDisabled();
    });
  });
});
