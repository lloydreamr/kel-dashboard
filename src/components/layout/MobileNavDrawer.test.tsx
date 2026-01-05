/**
 * MobileNavDrawer Component Tests
 *
 * Unit tests for mobile navigation slide-out drawer.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNavigationStore } from '@/stores/navigation';

import { MobileNavDrawer } from './MobileNavDrawer';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock the LogoutButton component
vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button data-testid="nav-logout">Sign out</button>,
}));

// Mock useQueueStore
vi.mock('@/stores/queue', () => ({
  useQueueStore: () => vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <div {...props} data-motion="true">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('MobileNavDrawer', () => {
  const defaultProps = {
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigationStore.setState({ isOpen: false });
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('when closed', () => {
    it('does not render drawer content', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(screen.queryByTestId('nav-drawer')).not.toBeInTheDocument();
    });
  });

  describe('when open', () => {
    beforeEach(() => {
      useNavigationStore.setState({ isOpen: true });
    });

    it('renders drawer with data-testid', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-drawer')).toBeInTheDocument();
    });

    it('renders menu title', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('renders all navigation links', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert - note: mobile links have 'mobile-' prefix
      expect(screen.getByTestId('mobile-nav-link-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-link-questions')).toBeInTheDocument();
      expect(
        screen.getByTestId('mobile-nav-link-visualization')
      ).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-link-progress')).toBeInTheDocument();
    });

    it('renders user section', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('mobile-nav-user-section')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders logout button', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-logout')).toBeInTheDocument();
    });

    it('locks body scroll', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('interactions', () => {
    beforeEach(() => {
      useNavigationStore.setState({ isOpen: true });
    });

    it('closes drawer when close button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MobileNavDrawer {...defaultProps} />);

      // Act
      const closeButton = screen.getByLabelText('Close navigation menu');
      await user.click(closeButton);

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });

    it('closes drawer when backdrop is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MobileNavDrawer {...defaultProps} />);

      // Act
      const backdrop = screen.getByTestId('nav-drawer-backdrop');
      await user.click(backdrop);

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });

    it('closes drawer when navigation link is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MobileNavDrawer {...defaultProps} />);

      // Act
      await user.click(screen.getByTestId('mobile-nav-link-questions'));

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });

    it('closes drawer when Escape key is pressed', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MobileNavDrawer {...defaultProps} />);

      // Act
      await user.keyboard('{Escape}');

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });

    it('restores body scroll when closed', async () => {
      // Arrange
      const { rerender } = render(<MobileNavDrawer {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      // Act - close the drawer via store (state updates are wrapped in act automatically by rerender)
      useNavigationStore.getState().close();
      rerender(<MobileNavDrawer {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      useNavigationStore.setState({ isOpen: true });
    });

    it('links have correct href attributes', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('mobile-nav-link-dashboard')).toHaveAttribute(
        'href',
        '/'
      );
      expect(screen.getByTestId('mobile-nav-link-questions')).toHaveAttribute(
        'href',
        '/questions'
      );
      expect(
        screen.getByTestId('mobile-nav-link-visualization')
      ).toHaveAttribute('href', '/visualization');
      expect(screen.getByTestId('mobile-nav-link-progress')).toHaveAttribute(
        'href',
        '/progress'
      );
    });

    it('close button has aria-label', () => {
      // Arrange & Act
      render(<MobileNavDrawer {...defaultProps} />);

      // Assert
      expect(
        screen.getByLabelText('Close navigation menu')
      ).toBeInTheDocument();
    });
  });
});
