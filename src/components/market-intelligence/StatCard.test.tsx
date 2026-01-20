import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Building2 } from 'lucide-react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StatCard } from './StatCard';

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

describe('StatCard', () => {
  const defaultProps = {
    title: 'Companies',
    count: 42,
    icon: Building2,
    href: '/market-intelligence/companies',
    testIdSuffix: 'companies',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and count', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with correct test id', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByTestId('mi-stat-card-companies')).toBeInTheDocument();
  });

  it('renders optional description', () => {
    render(<StatCard {...defaultProps} description="Competitor profiles" />);

    expect(screen.getByText('Competitor profiles')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.queryByText('Competitor profiles')).not.toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<StatCard {...defaultProps} />);

    // Icon is rendered with aria-hidden
    const card = screen.getByTestId('mi-stat-card-companies');
    const icon = card.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('links to correct href', () => {
    render(<StatCard {...defaultProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/market-intelligence/companies');
  });

  it('has minimum touch target of 48px', () => {
    render(<StatCard {...defaultProps} />);

    const card = screen.getByTestId('mi-stat-card-companies');
    expect(card).toHaveClass('min-h-[48px]');
  });

  it('renders count as zero', () => {
    render(<StatCard {...defaultProps} count={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders large counts', () => {
    render(<StatCard {...defaultProps} count={1234} />);

    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('has hover shadow effect class', () => {
    render(<StatCard {...defaultProps} />);

    const card = screen.getByTestId('mi-stat-card-companies');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('is clickable (cursor-pointer)', () => {
    render(<StatCard {...defaultProps} />);

    const card = screen.getByTestId('mi-stat-card-companies');
    expect(card).toHaveClass('cursor-pointer');
  });
});
