/**
 * ChatHeader Component Tests
 *
 * Unit tests for the chat header with copy and new conversation actions.
 *
 * Story 15.5: Chat Export and Share (Task 4)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ChatHeader } from './ChatHeader';

describe('ChatHeader', () => {
  const mockOnCopy = vi.fn();
  const mockOnNewConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility (AC 1, 3)', () => {
    it('renders nothing when showActions is false', () => {
      // Arrange & Act
      const { container } = render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={false}
        />
      );

      // Assert
      expect(container).toBeEmptyDOMElement();
    });

    it('renders header when showActions is true', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    });
  });

  describe('copy button (AC 1, 2)', () => {
    it('renders copy conversation button', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('copy-conversation-button')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy conversation/i })).toBeInTheDocument();
    });

    it('calls onCopy when copy button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Act
      await user.click(screen.getByTestId('copy-conversation-button'));

      // Assert
      expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });
  });

  describe('new conversation button (AC 3)', () => {
    it('renders new conversation button', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('new-conversation-button')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
    });

    it('calls onNewConversation when button clicked without confirm dialog', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
          showClearConfirm={false}
        />
      );

      // Act
      await user.click(screen.getByTestId('new-conversation-button'));

      // Assert
      expect(mockOnNewConversation).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear confirmation dialog (AC 5)', () => {
    it('shows confirmation dialog when showClearConfirm is true', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
          showClearConfirm={true}
        />
      );

      // Act
      await user.click(screen.getByTestId('new-conversation-button'));

      // Assert
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/start new conversation\?/i)).toBeInTheDocument();
      expect(screen.getByText(/this will clear your current conversation/i)).toBeInTheDocument();
    });

    it('does not call onNewConversation immediately when dialog opens', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
          showClearConfirm={true}
        />
      );

      // Act
      await user.click(screen.getByTestId('new-conversation-button'));

      // Assert
      expect(mockOnNewConversation).not.toHaveBeenCalled();
    });

    it('calls onNewConversation when "Start New" is clicked in dialog', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
          showClearConfirm={true}
        />
      );

      // Act
      await user.click(screen.getByTestId('new-conversation-button'));
      await user.click(screen.getByRole('button', { name: /start new/i }));

      // Assert
      expect(mockOnNewConversation).toHaveBeenCalledTimes(1);
    });

    it('closes dialog without action when "Cancel" is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
          showClearConfirm={true}
        />
      );

      // Act
      await user.click(screen.getByTestId('new-conversation-button'));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert
      expect(mockOnNewConversation).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('copy button has proper aria-label', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('copy-conversation-button')).toHaveAttribute(
        'aria-label',
        'Copy conversation'
      );
    });

    it('new conversation button has proper aria-label', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('new-conversation-button')).toHaveAttribute(
        'aria-label',
        'New conversation'
      );
    });
  });

  describe('touch targets', () => {
    it('buttons have minimum 48px touch target', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('copy-conversation-button')).toHaveClass('min-h-[48px]');
      expect(screen.getByTestId('copy-conversation-button')).toHaveClass('min-w-[48px]');
      expect(screen.getByTestId('new-conversation-button')).toHaveClass('min-h-[48px]');
      expect(screen.getByTestId('new-conversation-button')).toHaveClass('min-w-[48px]');
    });
  });

  describe('layout', () => {
    it('renders in a bordered container', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('chat-header')).toHaveClass('border-b');
    });

    it('aligns buttons to the right', () => {
      // Arrange & Act
      render(
        <ChatHeader
          onCopy={mockOnCopy}
          onNewConversation={mockOnNewConversation}
          showActions={true}
        />
      );

      // Assert
      expect(screen.getByTestId('chat-header')).toHaveClass('justify-end');
    });
  });
});
