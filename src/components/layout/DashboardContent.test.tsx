/**
 * DashboardContent Component Tests
 *
 * Unit tests for the dashboard content wrapper that handles
 * pitch mode visibility for sidebar/nav.
 *
 * Story 11.1: Pitch Mode View (Task 3)
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { usePitchModeStore } from '@/stores/pitchMode';

import { DashboardContent } from './DashboardContent';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// Mock PitchModeHeader (Story 11.2: Added PDF props)
vi.mock('@/components/visualization', () => ({
  PitchModeHeader: ({
    onExit,
    onDownloadPdf,
    isGeneratingPdf,
  }: {
    onExit: () => void;
    onDownloadPdf?: () => void;
    isGeneratingPdf?: boolean;
  }) => (
    <div data-testid="pitch-mode-header" onClick={onExit}>
      Mock Pitch Mode Header
      {onDownloadPdf && (
        <button
          data-testid="mock-download-pdf"
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
        >
          Download PDF
        </button>
      )}
    </div>
  ),
}));

describe('DashboardContent', () => {
  const mockSidebar = <nav data-testid="mock-sidebar">Sidebar</nav>;
  const mockMobileNav = <nav data-testid="mock-mobile-nav">Mobile Nav</nav>;
  const mockChildren = <div data-testid="mock-children">Page Content</div>;

  beforeEach(() => {
    // Reset store to default state
    usePitchModeStore.setState({ isPitchMode: false });
  });

  describe('normal mode', () => {
    it('renders sidebar in normal mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      const sidebar = screen.getByTestId('mock-sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar.parentElement).not.toHaveClass('hidden');
    });

    it('renders mobile nav in normal mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      expect(screen.getByTestId('mock-mobile-nav')).toBeInTheDocument();
    });

    it('does not render pitch mode header in normal mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      expect(screen.queryByTestId('pitch-mode-header')).not.toBeInTheDocument();
    });

    it('renders children in normal mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    });
  });

  describe('pitch mode', () => {
    beforeEach(() => {
      // Set pitch mode active
      usePitchModeStore.setState({ isPitchMode: true });
    });

    it('hides sidebar in pitch mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      const sidebarContainer = screen.getByTestId('mock-sidebar').parentElement;
      expect(sidebarContainer).toHaveClass('hidden');
    });

    it('hides mobile nav in pitch mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      expect(screen.queryByTestId('mock-mobile-nav')).not.toBeInTheDocument();
    });

    it('renders pitch mode header in pitch mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert - two headers rendered (mobile and desktop), use getAllBy
      const headers = screen.getAllByTestId('pitch-mode-header');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('renders children in pitch mode', () => {
      // Arrange & Act
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('uses flex layout', () => {
      // Arrange & Act
      const { container } = render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
    });

    it('has min-h-screen', () => {
      // Arrange & Act
      const { container } = render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Assert
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
    });
  });

  describe('store reactivity', () => {
    it('reacts to pitch mode store changes', () => {
      // Arrange
      render(
        <DashboardContent sidebar={mockSidebar} mobileNav={mockMobileNav}>
          {mockChildren}
        </DashboardContent>
      );

      // Initial state - sidebar visible
      expect(
        screen.getByTestId('mock-sidebar').parentElement
      ).not.toHaveClass('hidden');

      // Act - change store state wrapped in act()
      act(() => {
        usePitchModeStore.setState({ isPitchMode: true });
      });

      // Assert - sidebar now hidden
      expect(screen.getByTestId('mock-sidebar').parentElement).toHaveClass(
        'hidden'
      );
    });
  });
});
