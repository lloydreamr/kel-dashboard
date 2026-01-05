/**
 * MobileNav Component Tests
 *
 * Unit tests for mobile navigation header.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNavigationStore } from '@/stores/navigation';

import { MobileNav } from './MobileNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock the MobileNavDrawer component
vi.mock('./MobileNavDrawer', () => ({
  MobileNavDrawer: ({ userEmail }: { userEmail: string }) => (
    <div data-testid="mock-drawer">Drawer for {userEmail}</div>
  ),
}));

describe('MobileNav', () => {
  const defaultProps = {
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigationStore.setState({ isOpen: false });
  });

  describe('rendering', () => {
    it('renders brand/logo', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />);

      // Assert
      expect(screen.getByText('Kel Dashboard')).toBeInTheDocument();
    });

    it('renders hamburger button with data-testid', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-hamburger')).toBeInTheDocument();
    });

    it('renders mobile nav drawer', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('mock-drawer')).toBeInTheDocument();
    });
  });

  describe('hamburger interaction', () => {
    it('toggles navigation when hamburger is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MobileNav {...defaultProps} />);

      // Assert initial state
      expect(useNavigationStore.getState().isOpen).toBe(false);

      // Act
      await user.click(screen.getByTestId('nav-hamburger'));

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('hamburger button has aria-label', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-hamburger')).toHaveAttribute(
        'aria-label',
        'Open navigation menu'
      );
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      // Arrange & Act
      const { container } = render(
        <MobileNav {...defaultProps} className="custom-class" />
      );

      // Assert
      const header = container.querySelector('header');
      expect(header).toHaveClass('custom-class');
    });
  });
});
