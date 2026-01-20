import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GenerateContentButton } from './GenerateContentButton';

// Mock hooks
const mockMutate = vi.fn();
let mockIsPending = false;
let mockVariables: { sectionType?: string } | undefined;

vi.mock('@/hooks/pitch', () => ({
  useGeneratePitchContent: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    variables: mockVariables,
  }),
  getGenerationState: (isPending: boolean, variables: { sectionType?: string } | undefined) => ({
    isGenerating: isPending,
    generatingSectionType: variables?.sectionType,
  }),
}));

describe('GenerateContentButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockVariables = undefined;
  });

  describe('when no existing content', () => {
    it('renders generate button', () => {
      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="market_opportunity"
          hasExistingContent={false}
        />
      );

      const button = screen.getByTestId('generate-market_opportunity-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Generate');
    });

    it('shows Sparkles icon', () => {
      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="market_opportunity"
          hasExistingContent={false}
        />
      );

      // Sparkles icon should be present (check for svg)
      const button = screen.getByTestId('generate-market_opportunity-button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('when content exists', () => {
    it('renders regenerate button', () => {
      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="market_opportunity"
          hasExistingContent={true}
        />
      );

      const button = screen.getByTestId('generate-market_opportunity-button');
      expect(button).toHaveTextContent('Regenerate');
    });
  });

  describe('click behavior', () => {
    it('calls mutation with correct parameters', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="market_opportunity"
          onSuccess={onSuccess}
        />
      );

      await user.click(screen.getByTestId('generate-market_opportunity-button'));

      expect(mockMutate).toHaveBeenCalledWith(
        {
          pitchDraftId: 'd1',
          sectionType: 'market_opportunity',
          context: undefined,
        },
        { onSuccess }
      );
    });

    it('passes context to mutation when provided', async () => {
      const user = userEvent.setup();
      const context = { company_ids: ['c1', 'c2'] };

      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="competitive_positioning"
          context={context}
        />
      );

      await user.click(screen.getByTestId('generate-competitive_positioning-button'));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ context }),
        expect.any(Object)
      );
    });
  });

  describe('loading state', () => {
    it('shows loading text when this section is generating', () => {
      mockIsPending = true;
      mockVariables = { sectionType: 'market_opportunity' };

      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="market_opportunity"
        />
      );

      const button = screen.getByTestId('generate-market_opportunity-button');
      expect(button).toHaveTextContent('Generating...');
    });

    it('is disabled when any section is generating', () => {
      mockIsPending = true;
      mockVariables = { sectionType: 'market_opportunity' };

      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="competitive_positioning"
        />
      );

      const button = screen.getByTestId('generate-competitive_positioning-button');
      expect(button).toBeDisabled();
    });

    it('shows normal text when different section is generating', () => {
      mockIsPending = true;
      mockVariables = { sectionType: 'market_opportunity' };

      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType="trend_alignment"
        />
      );

      const button = screen.getByTestId('generate-trend_alignment-button');
      expect(button).toHaveTextContent('Generate');
    });
  });

  describe('different section types', () => {
    it.each([
      'market_opportunity',
      'competitive_positioning',
      'trend_alignment',
    ] as const)('renders button for %s section', (sectionType) => {
      render(
        <GenerateContentButton
          pitchDraftId="d1"
          sectionType={sectionType}
        />
      );

      expect(screen.getByTestId(`generate-${sectionType}-button`)).toBeInTheDocument();
    });
  });
});
