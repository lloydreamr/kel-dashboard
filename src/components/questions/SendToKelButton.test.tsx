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
    render(<SendToKelButton hasRecommendation onConfirm={mockOnConfirm} />);
    expect(screen.getByTestId('send-to-kel-button')).toBeInTheDocument();
  });

  it('disables button when hasRecommendation is false', () => {
    render(
      <SendToKelButton hasRecommendation={false} onConfirm={mockOnConfirm} />
    );
    expect(screen.getByTestId('send-to-kel-button')).toBeDisabled();
  });

  it('enables button when hasRecommendation is true', () => {
    render(<SendToKelButton hasRecommendation onConfirm={mockOnConfirm} />);
    expect(screen.getByTestId('send-to-kel-button')).toBeEnabled();
  });

  it('shows tooltip when button is disabled', async () => {
    const user = userEvent.setup();
    render(
      <SendToKelButton hasRecommendation={false} onConfirm={mockOnConfirm} />
    );

    await user.hover(screen.getByTestId('send-to-kel-button'));

    await waitFor(() => {
      // Radix tooltip renders multiple elements with the same text for a11y
      // Use getAllByText and check that at least one is present
      const tooltipTexts = screen.getAllByText('Add a recommendation first');
      expect(tooltipTexts.length).toBeGreaterThan(0);
    });
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<SendToKelButton hasRecommendation onConfirm={mockOnConfirm} />);

    await user.click(screen.getByTestId('send-to-kel-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('send-to-kel-confirm-dialog')
      ).toBeInTheDocument();
    });
  });

  it('shows correct dialog text', async () => {
    const user = userEvent.setup();
    render(<SendToKelButton hasRecommendation onConfirm={mockOnConfirm} />);

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
    render(<SendToKelButton hasRecommendation onConfirm={mockOnConfirm} />);

    await user.click(screen.getByTestId('send-to-kel-button'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not call onConfirm when dialog is cancelled', async () => {
    const user = userEvent.setup();
    render(<SendToKelButton hasRecommendation onConfirm={mockOnConfirm} />);

    await user.click(screen.getByTestId('send-to-kel-button'));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('shows loading text when isPending is true', () => {
    render(
      <SendToKelButton hasRecommendation onConfirm={mockOnConfirm} isPending />
    );
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('disables button when isPending is true', () => {
    render(
      <SendToKelButton hasRecommendation onConfirm={mockOnConfirm} isPending />
    );
    expect(screen.getByTestId('send-to-kel-button')).toBeDisabled();
  });
});
