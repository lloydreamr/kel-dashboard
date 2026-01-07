/**
 * DownloadPdfButton Component Tests
 *
 * Unit tests for the PDF download button in Pitch Mode.
 * Story 11.2: PDF One-Pager Export (Task 4)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DownloadPdfButton } from './DownloadPdfButton';

describe('DownloadPdfButton', () => {
  const defaultProps = {
    onClick: vi.fn(),
    isGenerating: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with correct test id', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toBeInTheDocument();
    });

    it('displays "Download PDF" text when not generating', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} />);

      // Assert
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('has minimum 48px touch target height', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} />);

      // Assert - Button component has min-h-12 (48px) built in
      const button = screen.getByTestId('pdf-download-button');
      expect(button).toHaveClass('min-h-12');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      // Arrange
      const onClick = vi.fn();
      render(<DownloadPdfButton onClick={onClick} isGenerating={false} />);

      // Act
      fireEvent.click(screen.getByTestId('pdf-download-button'));

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      // Arrange
      const onClick = vi.fn();
      render(<DownloadPdfButton onClick={onClick} isGenerating={true} />);

      // Act
      fireEvent.click(screen.getByTestId('pdf-download-button'));

      // Assert
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when isGenerating is true', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={true} />);

      // Assert
      expect(screen.getByTestId('pdf-generating-indicator')).toBeInTheDocument();
    });

    it('hides loading indicator when isGenerating is false', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={false} />);

      // Assert
      expect(screen.queryByTestId('pdf-generating-indicator')).not.toBeInTheDocument();
    });

    it('displays "Generating..." text when loading', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={true} />);

      // Assert
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
    });

    it('disables button when generating', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={true} />);

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toBeDisabled();
    });

    it('enables button when not generating', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={false} />);

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toBeEnabled();
    });

    it('loading spinner has animate-spin class', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={true} />);

      // Assert - The Loader2 component has animate-spin class
      const indicator = screen.getByTestId('pdf-generating-indicator');
      expect(indicator).toHaveClass('animate-spin');
    });
  });

  describe('accessibility', () => {
    it('has aria-busy attribute when generating', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={true} />);

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy false when not generating', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={false} />);

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toHaveAttribute('aria-busy', 'false');
    });

    it('has aria-label for screen readers', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('pdf-download-button')).toHaveAttribute(
        'aria-label',
        'Download PDF'
      );
    });
  });

  describe('button styling', () => {
    it('uses default variant styling', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} />);

      // Assert - should have primary button styling
      const button = screen.getByTestId('pdf-download-button');
      expect(button).toHaveClass('bg-primary');
    });

    it('shows download icon when not generating', () => {
      // Arrange & Act
      render(<DownloadPdfButton {...defaultProps} isGenerating={false} />);

      // Assert - Download icon should be present (via sr-only text or visual)
      const button = screen.getByTestId('pdf-download-button');
      // Icon is rendered but we check for button content structure
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });
});
