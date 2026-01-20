/**
 * ChatInput Component Tests
 *
 * Unit tests for the chat message input component.
 *
 * Story 15.3: Ask AI Chat Interface (Task 3)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders textarea and send button', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('chat-send-button')).toBeInTheDocument();
    });

    it('displays custom placeholder', () => {
      // Arrange & Act
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          placeholder="Ask something..."
        />
      );

      // Assert
      expect(screen.getByPlaceholderText('Ask something...')).toBeInTheDocument();
    });

    it('shows default placeholder when not provided', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Assert
      expect(
        screen.getByPlaceholderText('Ask about market intelligence...')
      ).toBeInTheDocument();
    });

    it('displays provided value', () => {
      // Arrange & Act
      render(<ChatInput value="Hello world" onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-input-textarea')).toHaveValue('Hello world');
    });
  });

  describe('send button state', () => {
    it('disables send button when value is empty', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-send-button')).toBeDisabled();
    });

    it('disables send button when value is only whitespace', () => {
      // Arrange & Act
      render(<ChatInput value="   " onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-send-button')).toBeDisabled();
    });

    it('enables send button when value has content', () => {
      // Arrange & Act
      render(<ChatInput value="Hello" onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-send-button')).not.toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      // Arrange & Act
      render(<ChatInput value="Hello" onChange={mockOnChange} disabled={true} />);

      // Assert
      expect(screen.getByTestId('chat-send-button')).toBeDisabled();
    });
  });

  describe('disabled state', () => {
    it('disables textarea when disabled is true', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} disabled={true} />);

      // Assert
      expect(screen.getByTestId('chat-input-textarea')).toBeDisabled();
    });

    it('enables textarea when disabled is false', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} disabled={false} />);

      // Assert
      expect(screen.getByTestId('chat-input-textarea')).not.toBeDisabled();
    });
  });

  describe('onChange handling', () => {
    it('calls onChange when user types', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Act
      await user.type(screen.getByTestId('chat-input-textarea'), 'a');

      // Assert
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has aria-label on textarea', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-input-textarea')).toHaveAttribute(
        'aria-label',
        'Message input'
      );
    });

    it('has aria-label on send button', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Assert
      expect(screen.getByTestId('chat-send-button')).toHaveAttribute(
        'aria-label',
        'Send message'
      );
    });
  });

  describe('touch targets', () => {
    it('send button has minimum 48px dimensions', () => {
      // Arrange & Act
      render(<ChatInput value="Test" onChange={mockOnChange} />);

      // Assert - verify classes are applied (actual dimension testing requires E2E)
      const button = screen.getByTestId('chat-send-button');
      expect(button).toHaveClass('min-h-[48px]');
      expect(button).toHaveClass('min-w-[48px]');
    });

    it('textarea has minimum 48px height', () => {
      // Arrange & Act
      render(<ChatInput value="" onChange={mockOnChange} />);

      // Assert
      const textarea = screen.getByTestId('chat-input-textarea');
      expect(textarea).toHaveClass('min-h-[48px]');
    });
  });
});
