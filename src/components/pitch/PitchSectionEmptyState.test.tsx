import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PitchSectionEmptyState } from './PitchSectionEmptyState';

// Mock GenerateContentButton to simplify testing
vi.mock('./GenerateContentButton', () => ({
  GenerateContentButton: ({ pitchDraftId, sectionType }: {
    pitchDraftId: string;
    sectionType: string;
  }) => (
    <button data-testid={`generate-${sectionType}-button`}>
      Generate for {pitchDraftId}
    </button>
  ),
}));

describe('PitchSectionEmptyState', () => {
  describe('market_opportunity section', () => {
    it('renders with correct label and description', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="market_opportunity"
        />
      );

      expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
      expect(
        screen.getByText('Market size, growth potential, and white space opportunities')
      ).toBeInTheDocument();
    });

    it('has correct test id', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="market_opportunity"
        />
      );

      expect(
        screen.getByTestId('pitch-section-empty-market_opportunity')
      ).toBeInTheDocument();
    });
  });

  describe('competitive_positioning section', () => {
    it('renders with correct label and description', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="competitive_positioning"
        />
      );

      expect(screen.getByText('Competitive Positioning')).toBeInTheDocument();
      expect(
        screen.getByText('How Kel products differentiate from existing offerings')
      ).toBeInTheDocument();
    });

    it('has correct test id', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="competitive_positioning"
        />
      );

      expect(
        screen.getByTestId('pitch-section-empty-competitive_positioning')
      ).toBeInTheDocument();
    });
  });

  describe('trend_alignment section', () => {
    it('renders with correct label and description', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="trend_alignment"
        />
      );

      expect(screen.getByText('Trend Alignment')).toBeInTheDocument();
      expect(
        screen.getByText('Alignment with current consumer and industry trends')
      ).toBeInTheDocument();
    });

    it('has correct test id', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="trend_alignment"
        />
      );

      expect(
        screen.getByTestId('pitch-section-empty-trend_alignment')
      ).toBeInTheDocument();
    });
  });

  describe('common elements', () => {
    it('shows empty state message', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="market_opportunity"
        />
      );

      expect(screen.getByText('No content yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Generate AI-powered content using your market intelligence data/)
      ).toBeInTheDocument();
    });

    it('renders GenerateContentButton with correct props', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="draft-123"
          sectionType="trend_alignment"
        />
      );

      const button = screen.getByTestId('generate-trend_alignment-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Generate for draft-123');
    });
  });

  describe('custom className', () => {
    it('applies custom className to card', () => {
      render(
        <PitchSectionEmptyState
          pitchDraftId="d1"
          sectionType="market_opportunity"
          className="custom-empty-state"
        />
      );

      const card = screen.getByTestId('pitch-section-empty-market_opportunity');
      expect(card).toHaveClass('custom-empty-state');
    });
  });
});
