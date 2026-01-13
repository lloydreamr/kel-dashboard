import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { OpportunityCard } from './OpportunityCard';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock opportunity data
const mockOpportunity = {
  id: 'opp-1',
  title: 'Test Market Gap Opportunity',
  description: 'A detailed description of the market opportunity',
  category: 'market_gap',
  status: 'new',
  confidence_score: 0.85,
  supporting_evidence: [],
  generated_at: '2024-01-15T00:00:00Z',
  reviewed_at: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

describe('OpportunityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders opportunity title', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      expect(screen.getByText('Test Market Gap Opportunity')).toBeInTheDocument();
    });

    it('renders opportunity description', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      expect(
        screen.getByText('A detailed description of the market opportunity')
      ).toBeInTheDocument();
    });

    it('renders fallback when description is empty', () => {
      const oppWithNoDesc = { ...mockOpportunity, description: null };
      render(<OpportunityCard opportunity={oppWithNoDesc} />);

      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    it('renders category badge with correct label', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      expect(screen.getByText('Market Gap')).toBeInTheDocument();
    });

    it('renders data-testid for testing', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
    });
  });

  describe('confidence indicator', () => {
    it('shows high confidence (>0.8)', () => {
      const highConfidence = { ...mockOpportunity, confidence_score: 0.9 };
      render(<OpportunityCard opportunity={highConfidence} />);

      expect(screen.getByText(/High/)).toBeInTheDocument();
      expect(screen.getByText('(90%)')).toBeInTheDocument();
    });

    it('shows medium confidence (0.5-0.8)', () => {
      const mediumConfidence = { ...mockOpportunity, confidence_score: 0.65 };
      render(<OpportunityCard opportunity={mediumConfidence} />);

      expect(screen.getByText(/Medium/)).toBeInTheDocument();
      expect(screen.getByText('(65%)')).toBeInTheDocument();
    });

    it('shows low confidence (<0.5)', () => {
      const lowConfidence = { ...mockOpportunity, confidence_score: 0.3 };
      render(<OpportunityCard opportunity={lowConfidence} />);

      expect(screen.getByText(/Low/)).toBeInTheDocument();
      expect(screen.getByText('(30%)')).toBeInTheDocument();
    });

    it('handles boundary case at exactly 0.8 as medium', () => {
      const boundaryConfidence = { ...mockOpportunity, confidence_score: 0.8 };
      render(<OpportunityCard opportunity={boundaryConfidence} />);

      expect(screen.getByText(/Medium/)).toBeInTheDocument();
    });

    it('handles boundary case at exactly 0.5 as medium', () => {
      const boundaryConfidence = { ...mockOpportunity, confidence_score: 0.5 };
      render(<OpportunityCard opportunity={boundaryConfidence} />);

      expect(screen.getByText(/Medium/)).toBeInTheDocument();
    });
  });

  describe('category badges', () => {
    it('renders Market Gap category', () => {
      render(<OpportunityCard opportunity={{ ...mockOpportunity, category: 'market_gap' }} />);
      expect(screen.getByText('Market Gap')).toBeInTheDocument();
    });

    it('renders Product Opportunity category', () => {
      render(
        <OpportunityCard opportunity={{ ...mockOpportunity, category: 'product_opportunity' }} />
      );
      expect(screen.getByText('Product Opportunity')).toBeInTheDocument();
    });

    it('renders Competitive Weakness category', () => {
      render(
        <OpportunityCard opportunity={{ ...mockOpportunity, category: 'competitive_weakness' }} />
      );
      expect(screen.getByText('Competitive Weakness')).toBeInTheDocument();
    });

    it('renders Trend Alignment category', () => {
      render(
        <OpportunityCard opportunity={{ ...mockOpportunity, category: 'trend_alignment' }} />
      );
      expect(screen.getByText('Trend Alignment')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to opportunity detail on click', async () => {
      const user = userEvent.setup();
      render(<OpportunityCard opportunity={mockOpportunity} />);

      await user.click(screen.getByTestId('opportunity-card'));

      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/opportunities/opp-1');
    });

    it('navigates on Enter key press', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      const card = screen.getByTestId('opportunity-card');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/opportunities/opp-1');
    });

    it('navigates on Space key press', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      const card = screen.getByTestId('opportunity-card');
      fireEvent.keyDown(card, { key: ' ' });

      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/opportunities/opp-1');
    });

    it('does not navigate on other key presses', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      const card = screen.getByTestId('opportunity-card');
      fireEvent.keyDown(card, { key: 'Tab' });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="button"', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has tabIndex=0 for keyboard focus', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      const card = screen.getByTestId('opportunity-card');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('has aria-label for screen readers', () => {
      render(<OpportunityCard opportunity={mockOpportunity} />);

      const card = screen.getByTestId('opportunity-card');
      expect(card).toHaveAttribute(
        'aria-label',
        'View Test Market Gap Opportunity opportunity'
      );
    });
  });
});
