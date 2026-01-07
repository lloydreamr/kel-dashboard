/**
 * EnterPitchModeButton Component Tests
 *
 * Unit tests for the button that activates Pitch Mode for
 * professional distributor presentations.
 *
 * Story 11.1: Pitch Mode View (Task 4)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { EnterPitchModeButton } from './EnterPitchModeButton';

describe('EnterPitchModeButton', () => {
  const defaultProps = {
    onClick: vi.fn(),
  };

  describe('rendering', () => {
    it('renders the button', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert
      expect(
        screen.getByTestId('enter-pitch-mode-button')
      ).toBeInTheDocument();
    });

    it('displays correct button text', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert
      expect(screen.getByText(/pitch mode/i)).toBeInTheDocument();
    });

    it('renders with presentation icon', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert - look for the icon (lucide-react adds sr-only text or we check for svg)
      const button = screen.getByTestId('enter-pitch-mode-button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      // Arrange
      const handleClick = vi.fn();
      render(<EnterPitchModeButton onClick={handleClick} />);

      // Act
      fireEvent.click(screen.getByTestId('enter-pitch-mode-button'));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('uses outline variant styling', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert - outline variant has border styling
      const button = screen.getByTestId('enter-pitch-mode-button');
      expect(button).toHaveClass('border');
    });

    it('has minimum touch target height of 48px', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert
      const button = screen.getByTestId('enter-pitch-mode-button');
      expect(button).toHaveClass('min-h-12');
    });
  });

  describe('accessibility', () => {
    it('has accessible name', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert
      const button = screen.getByRole('button', { name: /pitch mode/i });
      expect(button).toBeInTheDocument();
    });

    it('is not disabled by default', () => {
      // Arrange & Act
      render(<EnterPitchModeButton {...defaultProps} />);

      // Assert
      const button = screen.getByTestId('enter-pitch-mode-button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('custom className', () => {
    it('accepts additional className', () => {
      // Arrange & Act
      render(
        <EnterPitchModeButton {...defaultProps} className="custom-class" />
      );

      // Assert
      const button = screen.getByTestId('enter-pitch-mode-button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
