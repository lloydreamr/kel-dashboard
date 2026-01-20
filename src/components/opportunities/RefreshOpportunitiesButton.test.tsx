/**
 * RefreshOpportunitiesButton Component Tests
 *
 * Tests for manual opportunity refresh button.
 * Verifies render states, loading, cooldown, and timestamp display.
 *
 * Story 16-5: Manual Opportunity Refresh
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the hook - must be before component import
const mockMutate = vi.fn();
let mockIsPending = false;
let mockIsCooldown = false;
let mockCooldownSeconds = 0;
let mockLastRefresh: Date | null = null;

vi.mock('@/hooks/opportunities', () => ({
  useGenerateOpportunities: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    isCooldown: mockIsCooldown,
    cooldownSeconds: mockCooldownSeconds,
    lastRefresh: mockLastRefresh,
  }),
}));

import { RefreshOpportunitiesButton } from './RefreshOpportunitiesButton';

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('RefreshOpportunitiesButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockIsCooldown = false;
    mockCooldownSeconds = 0;
    mockLastRefresh = null;
  });

  it('renders with correct text in normal state', () => {
    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    expect(button).toHaveTextContent('Refresh Opportunities');
    expect(button).not.toBeDisabled();
  });

  it('renders with RotateCw icon in normal state', () => {
    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    // Check that SVG icon is present (RotateCw from lucide-react)
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Should not have animate-spin class in normal state
    expect(svg).not.toHaveClass('animate-spin');
  });

  it('shows loading state with Loader2 animate-spin icon when isPending', () => {
    mockIsPending = true;

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    expect(button).toHaveTextContent('Generating...');
    expect(button).toBeDisabled();

    // Check for animate-spin class on the icon
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('button is disabled during loading', () => {
    mockIsPending = true;

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    expect(button).toBeDisabled();
  });

  it('button is disabled during cooldown', () => {
    mockIsCooldown = true;
    mockCooldownSeconds = 25;

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    expect(button).toBeDisabled();
  });

  it('shows cooldown timer text during cooldown', () => {
    mockIsCooldown = true;
    mockCooldownSeconds = 25;

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    expect(button).toHaveTextContent('Wait 25s');
  });

  it('displays "Last refreshed" timestamp when available', () => {
    // Set last refresh to 2 hours ago
    mockLastRefresh = new Date(Date.now() - 2 * 60 * 60 * 1000);

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    // formatDistanceToNow should show something like "about 2 hours ago"
    expect(screen.getByText(/Last refreshed:/)).toBeInTheDocument();
    expect(screen.getByText(/hours ago/i)).toBeInTheDocument();
  });

  it('does not display "Last refreshed" when lastRefresh is null', () => {
    mockLastRefresh = null;

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    expect(screen.queryByText(/Last refreshed:/)).not.toBeInTheDocument();
  });

  it('onClick triggers mutation', async () => {
    const user = userEvent.setup();

    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    await user.click(button);

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('has correct touch target size (48px)', () => {
    render(<RefreshOpportunitiesButton />, { wrapper: TestWrapper });

    const button = screen.getByTestId('refresh-opportunities-button');
    expect(button).toHaveClass('min-h-[48px]');
  });
});
