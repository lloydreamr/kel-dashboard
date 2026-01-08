/**
 * LogoutButton Component Tests
 *
 * Unit tests for logout button functionality.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useQueueStore } from '@/stores/queue';

import { LogoutButton } from './LogoutButton';

// Mock the logout server action
vi.mock('@/app/(dashboard)/actions', () => ({
  logout: vi.fn(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset queue store
    useQueueStore.setState({ draftResponses: { 'test-id': { decision: 'approve', response: 'test' } } });
  });

  describe('rendering', () => {
    it('renders button with data-testid', () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      expect(screen.getByTestId('nav-logout')).toBeInTheDocument();
    });

    it('renders sign out text', () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('renders as submit button in form', () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      const button = screen.getByTestId('nav-logout');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button.closest('form')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('clears all drafts when form is submitted', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Verify drafts exist before
      expect(useQueueStore.getState().draftResponses).toHaveProperty('test-id');

      // Act - click the button (form submit)
      await user.click(screen.getByTestId('nav-logout'));

      // Assert - drafts should be cleared
      expect(useQueueStore.getState().draftResponses).toEqual({});
    });
  });

  describe('styling', () => {
    it('has minimum 48px touch target', () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      const button = screen.getByTestId('nav-logout');
      expect(button).toHaveClass('min-h-12');
    });

    it('has full width styling', () => {
      // Arrange & Act
      render(<LogoutButton />);

      // Assert
      const button = screen.getByTestId('nav-logout');
      expect(button).toHaveClass('w-full');
    });
  });
});
