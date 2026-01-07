/**
 * PitchModeHeader Component Tests
 *
 * Unit tests for the pitch mode header component.
 * Story 11.1: Pitch Mode View (Task 2)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { PitchModeHeader } from './PitchModeHeader';

describe('PitchModeHeader', () => {
  describe('rendering', () => {
    it('renders with data-testid pitch-mode-header', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('pitch-mode-header')).toBeInTheDocument();
    });

    it('displays Kel branding', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(screen.getByText('Kel')).toBeInTheDocument();
    });

    it('displays subtitle text', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(screen.getByText('Competitor Positioning')).toBeInTheDocument();
    });

    it('renders exit button with correct test id', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('exit-pitch-mode-button')).toBeInTheDocument();
    });

    it('renders exit button with accessible text', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(
        screen.getByRole('button', { name: /exit pitch mode/i })
      ).toBeInTheDocument();
    });
  });

  describe('exit button', () => {
    it('calls onExit when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnExit = vi.fn();
      render(<PitchModeHeader onExit={mockOnExit} />);

      // Act
      await user.click(screen.getByTestId('exit-pitch-mode-button'));

      // Assert
      expect(mockOnExit).toHaveBeenCalledTimes(1);
    });

    it('has 48px minimum height for touch targets', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      const button = screen.getByTestId('exit-pitch-mode-button');
      expect(button).toHaveClass('min-h-12');
    });
  });

  describe('styling', () => {
    it('has sticky positioning', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      const header = screen.getByTestId('pitch-mode-header');
      expect(header).toHaveClass('sticky');
    });

    it('has z-index for proper stacking', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      const header = screen.getByTestId('pitch-mode-header');
      expect(header).toHaveClass('z-50');
    });

    it('has bottom border', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      const header = screen.getByTestId('pitch-mode-header');
      expect(header).toHaveClass('border-b');
    });
  });

  describe('accessibility', () => {
    it('uses semantic header element', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('PDF download button (Story 11.2)', () => {
    it('does not render download button when onDownloadPdf is not provided', () => {
      // Arrange & Act
      render(<PitchModeHeader onExit={vi.fn()} />);

      // Assert
      expect(screen.queryByTestId('pdf-download-button')).not.toBeInTheDocument();
    });

    it('renders download button when onDownloadPdf is provided', () => {
      // Arrange & Act
      render(
        <PitchModeHeader
          onExit={vi.fn()}
          onDownloadPdf={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toBeInTheDocument();
    });

    it('calls onDownloadPdf when download button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockDownload = vi.fn();
      render(
        <PitchModeHeader
          onExit={vi.fn()}
          onDownloadPdf={mockDownload}
        />
      );

      // Act
      await user.click(screen.getByTestId('pdf-download-button'));

      // Assert
      expect(mockDownload).toHaveBeenCalledTimes(1);
    });

    it('disables download button when isGeneratingPdf is true', () => {
      // Arrange & Act
      render(
        <PitchModeHeader
          onExit={vi.fn()}
          onDownloadPdf={vi.fn()}
          isGeneratingPdf={true}
        />
      );

      // Assert
      const button = screen.getByTestId('pdf-download-button');
      expect(button).toBeDisabled();
    });

    it('enables download button when isGeneratingPdf is false', () => {
      // Arrange & Act
      render(
        <PitchModeHeader
          onExit={vi.fn()}
          onDownloadPdf={vi.fn()}
          isGeneratingPdf={false}
        />
      );

      // Assert
      const button = screen.getByTestId('pdf-download-button');
      expect(button).not.toBeDisabled();
    });
  });
});
