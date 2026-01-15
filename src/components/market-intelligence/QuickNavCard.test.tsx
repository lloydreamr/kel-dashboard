import { render, screen } from '@testing-library/react';
import { Building2 } from 'lucide-react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuickNavCard } from './QuickNavCard';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('QuickNavCard', () => {
  const defaultProps = {
    title: 'Companies',
    description: 'Browse competitor profiles',
    icon: Building2,
    href: '/market-intelligence/companies',
    testIdSuffix: 'companies',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description', () => {
    render(<QuickNavCard {...defaultProps} />);

    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Browse competitor profiles')).toBeInTheDocument();
  });

  it('renders with correct test id', () => {
    render(<QuickNavCard {...defaultProps} />);

    expect(screen.getByTestId('mi-nav-card-companies')).toBeInTheDocument();
  });

  it('links to correct href', () => {
    render(<QuickNavCard {...defaultProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/market-intelligence/companies');
  });

  it('renders icon', () => {
    render(<QuickNavCard {...defaultProps} />);

    const card = screen.getByTestId('mi-nav-card-companies');
    const icon = card.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders chevron right icon', () => {
    render(<QuickNavCard {...defaultProps} />);

    const card = screen.getByTestId('mi-nav-card-companies');
    const icons = card.querySelectorAll('svg');
    // Should have 2 icons: the main icon and chevron
    expect(icons.length).toBe(2);
  });

  it('has minimum touch target of 48px', () => {
    render(<QuickNavCard {...defaultProps} />);

    const card = screen.getByTestId('mi-nav-card-companies');
    expect(card).toHaveClass('min-h-[48px]');
  });

  it('has hover border effect class', () => {
    render(<QuickNavCard {...defaultProps} />);

    const card = screen.getByTestId('mi-nav-card-companies');
    expect(card).toHaveClass('hover:border-primary');
  });

  it('has hover shadow effect class', () => {
    render(<QuickNavCard {...defaultProps} />);

    const card = screen.getByTestId('mi-nav-card-companies');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('is clickable (cursor-pointer)', () => {
    render(<QuickNavCard {...defaultProps} />);

    const card = screen.getByTestId('mi-nav-card-companies');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('truncates long descriptions', () => {
    render(<QuickNavCard {...defaultProps} />);

    const description = screen.getByText('Browse competitor profiles');
    expect(description).toHaveClass('truncate');
  });
});
