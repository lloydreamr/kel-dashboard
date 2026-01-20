/**
 * FreshnessWarningBadge Component Tests
 *
 * Tests the warning badge that displays when a category has stale questions.
 * Badge shows count of stale items and is clickable for navigation.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { FreshnessWarningBadge } from './FreshnessWarningBadge';

// Mock Tooltip components to simplify testing
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <span>{children}</span>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip">{children}</span>,
}));

describe('FreshnessWarningBadge', () => {
  it('renders nothing when staleCount is 0', () => {
    render(<FreshnessWarningBadge staleCount={0} category="market" />);

    expect(screen.queryByTestId('freshness-warning-badge')).not.toBeInTheDocument();
  });

  it('renders badge when staleCount is greater than 0', () => {
    render(<FreshnessWarningBadge staleCount={2} category="market" />);

    expect(screen.getByTestId('freshness-warning-badge')).toBeInTheDocument();
  });

  it('renders singular text for 1 item', () => {
    render(<FreshnessWarningBadge staleCount={1} category="market" />);

    expect(screen.getByTestId('freshness-count')).toHaveTextContent('1 item needs attention');
  });

  it('renders plural text for multiple items', () => {
    render(<FreshnessWarningBadge staleCount={3} category="product" />);

    expect(screen.getByTestId('freshness-count')).toHaveTextContent('3 items need attention');
  });

  it('calls onClick when badge is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<FreshnessWarningBadge staleCount={2} category="market" onClick={handleClick} />);

    await user.click(screen.getByTestId('freshness-warning-badge'));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Enter keypress', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<FreshnessWarningBadge staleCount={2} category="market" onClick={handleClick} />);

    const badge = screen.getByTestId('freshness-warning-badge');
    badge.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Space keypress', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<FreshnessWarningBadge staleCount={2} category="market" onClick={handleClick} />);

    const badge = screen.getByTestId('freshness-warning-badge');
    badge.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when other keys are pressed', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<FreshnessWarningBadge staleCount={2} category="market" onClick={handleClick} />);

    const badge = screen.getByTestId('freshness-warning-badge');
    badge.focus();
    await user.keyboard('a');

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<FreshnessWarningBadge staleCount={2} category="market" onClick={() => {}} />);

    const badge = screen.getByTestId('freshness-warning-badge');

    expect(badge).toHaveAttribute('role', 'button');
    expect(badge).toHaveAttribute('tabIndex', '0');
  });

  it('applies warning styles', () => {
    render(<FreshnessWarningBadge staleCount={2} category="market" />);

    const badge = screen.getByTestId('freshness-warning-badge');

    expect(badge).toHaveClass('text-warning');
    expect(badge).toHaveClass('border-warning/30');
    expect(badge).toHaveClass('bg-warning/10');
  });

  it('has minimum touch target height for tablet', () => {
    render(<FreshnessWarningBadge staleCount={2} category="market" />);

    const badge = screen.getByTestId('freshness-warning-badge');

    expect(badge).toHaveClass('min-h-12');
  });

  it('renders without onClick handler (not required)', () => {
    render(<FreshnessWarningBadge staleCount={2} category="market" />);

    expect(screen.getByTestId('freshness-warning-badge')).toBeInTheDocument();
  });
});
