/**
 * MiBreadcrumb Component Tests
 *
 * Tests the breadcrumb navigation component for Market Intelligence sub-pages.
 *
 * @see Story 17.3: Existing Visualization Integration (AC4)
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { MiBreadcrumb } from './MiBreadcrumb';

describe('MiBreadcrumb', () => {
  it('renders with correct test ID', () => {
    render(<MiBreadcrumb current="Test Page" />);

    expect(screen.getByTestId('mi-breadcrumb')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation element', () => {
    render(<MiBreadcrumb current="Test Page" />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders Market Intelligence link', () => {
    render(<MiBreadcrumb current="Test Page" />);

    const link = screen.getByRole('link', { name: 'Market Intelligence' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/market-intelligence');
  });

  it('renders current page name', () => {
    render(<MiBreadcrumb current="Visualization" />);

    expect(screen.getByText('Visualization')).toBeInTheDocument();
  });

  it('has 48px touch target on nav and link (AC4: tablet/mobile support)', () => {
    render(<MiBreadcrumb current="Test Page" />);

    // Nav element should have 48px touch target for entire row
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toHaveClass('min-h-[48px]');

    // Link should also have 48px touch target
    const link = screen.getByRole('link', { name: 'Market Intelligence' });
    expect(link).toHaveClass('min-h-[48px]');
  });

  it('marks current page with aria-current for accessibility', () => {
    render(<MiBreadcrumb current="Visualization" />);

    const currentPage = screen.getByText('Visualization');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('renders different current page names correctly', () => {
    const { rerender } = render(<MiBreadcrumb current="Companies" />);
    expect(screen.getByText('Companies')).toBeInTheDocument();

    rerender(<MiBreadcrumb current="Products" />);
    expect(screen.getByText('Products')).toBeInTheDocument();

    rerender(<MiBreadcrumb current="Research" />);
    expect(screen.getByText('Research')).toBeInTheDocument();
  });
});
