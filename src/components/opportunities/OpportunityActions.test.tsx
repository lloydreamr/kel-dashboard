/**
 * OpportunityActions Component Tests
 *
 * Tests for opportunity action buttons - primarily the "Mark as Actionable" button.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { Opportunity } from '@/lib/repositories/opportunities';

// Mock the mutation hook - must be before component import
const mockMutate = vi.fn();
let mockIsPending = false;

vi.mock('@/hooks/opportunities', () => ({
  useUpdateOpportunityStatus: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}));

import { OpportunityActions } from './OpportunityActions';

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

const mockOpportunity: Opportunity = {
  id: 'test-opportunity-id',
  title: 'Market Gap in Premium Snacks',
  description: 'There is an opportunity in the premium snack segment',
  category: 'market_gap',
  confidence_score: 0.85,
  status: 'new',
  supporting_evidence: [],
  generated_at: '2024-01-15T10:00:00Z',
  reviewed_at: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

describe('OpportunityActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it('renders mark actionable button for non-actionable opportunity', () => {
    render(<OpportunityActions opportunity={mockOpportunity} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByTestId('mark-actionable-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Mark as Actionable');
    expect(button).not.toBeDisabled();
  });

  it('disables button and shows checkmark when already actionable', () => {
    const actionableOpportunity: Opportunity = {
      ...mockOpportunity,
      status: 'actionable',
    };

    render(<OpportunityActions opportunity={actionableOpportunity} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByTestId('mark-actionable-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Already Actionable');
  });

  it('calls mutate with correct params when clicked', async () => {
    const user = userEvent.setup();

    render(<OpportunityActions opportunity={mockOpportunity} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByTestId('mark-actionable-button');
    await user.click(button);

    expect(mockMutate).toHaveBeenCalledWith({
      id: 'test-opportunity-id',
      status: 'actionable',
    });
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('has correct touch target size (48px)', () => {
    render(<OpportunityActions opportunity={mockOpportunity} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByTestId('mark-actionable-button');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('disables button for reviewing status (not actionable)', () => {
    const reviewingOpportunity: Opportunity = {
      ...mockOpportunity,
      status: 'reviewing',
    };

    render(<OpportunityActions opportunity={reviewingOpportunity} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByTestId('mark-actionable-button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Mark as Actionable');
  });

  it('shows loading state when mutation is pending', () => {
    mockIsPending = true;

    render(<OpportunityActions opportunity={mockOpportunity} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByTestId('mark-actionable-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Updating...');
  });
});
