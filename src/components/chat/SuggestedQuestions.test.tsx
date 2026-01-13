/**
 * SuggestedQuestions Component Tests
 *
 * Unit tests for the suggested questions chip component.
 *
 * Story 15.4: Suggested Questions (Task 5)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { SuggestedQuestions } from './SuggestedQuestions';

const MOCK_QUESTIONS = [
  'Who are the main competitors in puffed snacks?',
  'What price point should Kel target for the 20-peso segment?',
  'What are the emerging flavor trends in Philippine snacks?',
  'Compare URC vs Oishi distribution reach',
  'What is URC\'s distribution network strategy?',
  'What product gaps exist in the Philippine snack market?',
];

describe('SuggestedQuestions', () => {
  const mockOnQuestionClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders 5-6 question chips (AC 1)', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(5);
      expect(buttons.length).toBeLessThanOrEqual(6);
    });

    it('displays all question texts', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      MOCK_QUESTIONS.forEach((question) => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });
    });

    it('renders the group container with test id', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      expect(screen.getByTestId('suggested-questions-group')).toBeInTheDocument();
    });
  });

  describe('click handling (AC 3)', () => {
    it('calls onQuestionClick with question text when chip clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Act
      await user.click(screen.getByRole('button', { name: /competitors/i }));

      // Assert
      expect(mockOnQuestionClick).toHaveBeenCalledWith(
        'Who are the main competitors in puffed snacks?'
      );
    });

    it('calls onQuestionClick only once per click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Act
      await user.click(screen.getByRole('button', { name: /flavor trends/i }));

      // Assert
      expect(mockOnQuestionClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state (AC 3)', () => {
    it('disables all chips when disabled prop is true', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
          disabled
        />
      );

      // Assert
      screen.getAllByRole('button').forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('enables all chips when disabled prop is false', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
          disabled={false}
        />
      );

      // Assert
      screen.getAllByRole('button').forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('does not call onClick when disabled and clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
          disabled
        />
      );

      // Act - try to click disabled button (userEvent respects disabled)
      const button = screen.getAllByRole('button')[0];
      await user.click(button);

      // Assert
      expect(mockOnQuestionClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility (AC 5)', () => {
    it('has proper accessibility attributes', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Suggested questions');
    });

    it('all chips are accessible as buttons', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(MOCK_QUESTIONS.length);
    });
  });

  describe('touch targets (AC 5)', () => {
    it('chips have minimum 48px touch target', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert - verify class is applied (actual dimension testing requires E2E)
      screen.getAllByRole('button').forEach((button) => {
        expect(button).toHaveClass('min-h-[48px]');
      });
    });

    it('chips have rounded-full styling', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      screen.getAllByRole('button').forEach((button) => {
        expect(button).toHaveClass('rounded-full');
      });
    });
  });

  describe('chip layout', () => {
    it('has flex-wrap for mobile responsiveness', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      const group = screen.getByTestId('suggested-questions-group');
      expect(group).toHaveClass('flex-wrap');
    });

    it('chips are centered', () => {
      // Arrange & Act
      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={mockOnQuestionClick}
        />
      );

      // Assert
      const group = screen.getByTestId('suggested-questions-group');
      expect(group).toHaveClass('justify-center');
    });
  });

  describe('integration contract (AC 3)', () => {
    it('passes full question text to callback for direct submit', async () => {
      // Arrange - simulate the AskPageClient handleSuggestionClick pattern
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      const handleSuggestionClick = async (question: string) => {
        await mockSendMessage({ text: question });
      };
      const user = userEvent.setup();

      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={handleSuggestionClick}
        />
      );

      // Act
      await user.click(screen.getByRole('button', { name: /price point/i }));

      // Assert - verifies the contract that enables direct submit
      expect(mockSendMessage).toHaveBeenCalledWith({
        text: 'What price point should Kel target for the 20-peso segment?',
      });
    });

    it('supports async callback without errors', async () => {
      // Arrange - async handler like AskPageClient uses
      const asyncHandler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const user = userEvent.setup();

      render(
        <SuggestedQuestions
          questions={MOCK_QUESTIONS}
          onQuestionClick={asyncHandler}
        />
      );

      // Act & Assert - should not throw
      await expect(
        user.click(screen.getByRole('button', { name: /competitors/i }))
      ).resolves.not.toThrow();

      expect(asyncHandler).toHaveBeenCalled();
    });
  });
});
