/**
 * Sidebar Component Tests
 *
 * Unit tests for desktop navigation sidebar.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Sidebar } from './Sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock the LogoutButton component
vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button data-testid="nav-logout">Sign out</button>,
}));

// Mock DashboardSyncIndicator to avoid QueryClient dependency
vi.mock('./DashboardSyncIndicator', () => ({
  DashboardSyncIndicator: () => (
    <div data-testid="mock-sync-indicator">Sync</div>
  ),
}));

// Mock useQueueStore
vi.mock('@/stores/queue', () => ({
  useQueueStore: () => vi.fn(),
}));

describe('Sidebar', () => {
  const defaultProps = {
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders sidebar with data-testid', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-sidebar')).toBeInTheDocument();
    });

    it('renders brand/logo area', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByText('Kel Dashboard')).toBeInTheDocument();
    });

    it('renders all navigation links', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-link-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-questions')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-visualization')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-progress')).toBeInTheDocument();
      // Story 17.3: Market Intelligence nav link enabled
      expect(screen.getByTestId('nav-link-market-intelligence')).toBeInTheDocument();
    });

    it('renders link labels', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Visualization')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      // Story 17.3: Market Intelligence nav link label
      expect(screen.getByText('Market Intel')).toBeInTheDocument();
    });
  });

  describe('user section', () => {
    it('renders user section with data-testid', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-user-section')).toBeInTheDocument();
    });

    it('displays user email', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays user avatar with initial', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of test@example.com
    });

    it('renders logout button', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-logout')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('shows active indicator for current page', async () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert - dashboard is active (pathname is '/')
      expect(screen.getByTestId('nav-active-indicator')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('links have correct href attributes', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('nav-link-dashboard')).toHaveAttribute(
        'href',
        '/'
      );
      // Story 17.4: Direct link to MI questions
      expect(screen.getByTestId('nav-link-questions')).toHaveAttribute(
        'href',
        '/market-intelligence/questions'
      );
      // Story 17.3: Direct link to MI visualization
      expect(screen.getByTestId('nav-link-visualization')).toHaveAttribute(
        'href',
        '/market-intelligence/visualization'
      );
      expect(screen.getByTestId('nav-link-progress')).toHaveAttribute(
        'href',
        '/progress'
      );
      // Story 17.3: Market Intelligence nav link href
      expect(screen.getByTestId('nav-link-market-intelligence')).toHaveAttribute(
        'href',
        '/market-intelligence'
      );
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      // Arrange & Act
      render(<Sidebar {...defaultProps} className="custom-class" />);

      // Assert
      expect(screen.getByTestId('nav-sidebar')).toHaveClass('custom-class');
    });
  });
});
