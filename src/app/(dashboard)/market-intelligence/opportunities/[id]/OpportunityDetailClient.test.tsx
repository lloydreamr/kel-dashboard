/**
 * OpportunityDetailClient Integration Tests
 *
 * Tests for the opportunity detail page client component.
 * Verifies loading states, error handling, and correct rendering of all sections.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { OpportunityDetailClient } from './OpportunityDetailClient';

import type { Opportunity } from '@/lib/repositories/opportunities';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock the hooks
const mockUseOpportunity = vi.fn();
const mockUpdateStatus = vi.fn();
let mockIsPending = false;

vi.mock('@/hooks/opportunities', () => ({
  useOpportunity: () => mockUseOpportunity(),
  useUpdateOpportunityStatus: () => ({
    mutate: mockUpdateStatus,
    isPending: mockIsPending,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOpportunity: Opportunity = {
  id: 'opp-1',
  title: 'Market Gap in Premium Snacks',
  description: 'There is an opportunity in the premium snack segment targeting health-conscious consumers.',
  category: 'market_gap',
  confidence_score: 0.85,
  status: 'new',
  supporting_evidence: [
    {
      entity_type: 'company',
      entity_id: 'company-123',
      relevance_score: 0.9,
      excerpt: 'URC shows strong growth in snack segment',
    },
    {
      entity_type: 'trend',
      entity_id: 'trend-456',
      relevance_score: 0.75,
      excerpt: 'Premium snacks growing at 15% YoY',
    },
  ],
  generated_at: '2024-01-15T10:00:00Z',
  reviewed_at: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

describe('OpportunityDetailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;

    mockUseOpportunity.mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      error: null,
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton when data is loading', () => {
      mockUseOpportunity.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      expect(screen.getByTestId('detail-page-skeleton')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows not found when opportunity does not exist', async () => {
      mockUseOpportunity.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Not found'),
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('entity-not-found')).toBeInTheDocument();
      });
    });

    it('shows not found when data is null without error', async () => {
      mockUseOpportunity.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('entity-not-found')).toBeInTheDocument();
      });
    });
  });

  describe('header section', () => {
    it('renders opportunity title', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getByText('Market Gap in Premium Snacks')).toBeInTheDocument();
      });
    });

    it('renders category badge', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getByText('Market Gap')).toBeInTheDocument();
      });
    });

    it('renders back navigation link', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /opportunities/i });
        expect(backLink).toHaveAttribute('href', '/market-intelligence/opportunities');
      });
    });
  });

  describe('description section', () => {
    it('renders opportunity description', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        // Text appears in both mobile and desktop views
        expect(screen.getAllByText(/health-conscious consumers/).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows fallback when description is empty', async () => {
      mockUseOpportunity.mockReturnValue({
        data: { ...mockOpportunity, description: null },
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        // Text appears in both mobile and desktop views
        const texts = screen.getAllByText('No description available');
        expect(texts.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('confidence section', () => {
    it('displays confidence level as high for scores > 0.8', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        // Element appears in both mobile and desktop views
        const levels = screen.getAllByTestId('confidence-level');
        expect(levels.length).toBeGreaterThanOrEqual(1);
        expect(levels[0]).toHaveTextContent('high');
      });
    });

    it('displays confidence percentage', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const percents = screen.getAllByTestId('confidence-percent');
        expect(percents.length).toBeGreaterThanOrEqual(1);
        expect(percents[0]).toHaveTextContent('85%');
      });
    });

    it('displays medium confidence for scores between 0.5 and 0.8', async () => {
      mockUseOpportunity.mockReturnValue({
        data: { ...mockOpportunity, confidence_score: 0.65 },
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const levels = screen.getAllByTestId('confidence-level');
        const percents = screen.getAllByTestId('confidence-percent');
        expect(levels[0]).toHaveTextContent('medium');
        expect(percents[0]).toHaveTextContent('65%');
      });
    });

    it('displays low confidence for scores < 0.5', async () => {
      mockUseOpportunity.mockReturnValue({
        data: { ...mockOpportunity, confidence_score: 0.35 },
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const levels = screen.getAllByTestId('confidence-level');
        const percents = screen.getAllByTestId('confidence-percent');
        expect(levels[0]).toHaveTextContent('low');
        expect(percents[0]).toHaveTextContent('35%');
      });
    });
  });

  describe('supporting evidence section', () => {
    it('renders evidence cards', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/^evidence-card-\d+$/)[0]).toBeInTheDocument();
      });
    });

    it('shows entity type labels', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        // May appear multiple times due to responsive rendering
        expect(screen.getAllByText('Company').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Trend').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows evidence excerpts', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/URC shows strong growth/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Premium snacks growing/).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders evidence links with correct URLs', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const companyLinks = screen.getAllByTestId('evidence-card-0');
        expect(companyLinks[0]).toHaveAttribute(
          'href',
          '/market-intelligence/companies/company-123'
        );
      });
    });

    it('shows empty state when no evidence', async () => {
      mockUseOpportunity.mockReturnValue({
        data: { ...mockOpportunity, supporting_evidence: [] },
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getAllByText('No supporting evidence available').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('details section', () => {
    it('renders status badge', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('opportunity-status-badge');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders generated date', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const dates = screen.getAllByTestId('generated-date');
        expect(dates.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows reviewed date when present', async () => {
      mockUseOpportunity.mockReturnValue({
        data: { ...mockOpportunity, reviewed_at: '2024-01-20T10:00:00Z' },
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const dates = screen.getAllByTestId('reviewed-date');
        expect(dates.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('action buttons', () => {
    it('renders mark actionable button', async () => {
      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('mark-actionable-button')).toBeInTheDocument();
      });
    });

    it('calls mutation when button is clicked', async () => {
      const user = userEvent.setup();

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('mark-actionable-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('mark-actionable-button'));

      expect(mockUpdateStatus).toHaveBeenCalledWith({
        id: 'opp-1',
        status: 'actionable',
      });
    });

    it('disables button when already actionable', async () => {
      mockUseOpportunity.mockReturnValue({
        data: { ...mockOpportunity, status: 'actionable' },
        isLoading: false,
        error: null,
      });

      render(<OpportunityDetailClient id="opp-1" />);

      await waitFor(() => {
        const button = screen.getByTestId('mark-actionable-button');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent('Already Actionable');
      });
    });
  });
});
