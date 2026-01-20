import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GenerateAllSectionsButton } from './GenerateAllSectionsButton';

// Mock hooks
const mockMutateAsync = vi.fn();

vi.mock('@/hooks/pitch', () => ({
  useGeneratePitchContent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('GenerateAllSectionsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('rendering', () => {
    it('renders button with count of sections to generate', () => {
      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={[]}
        />
      );

      const button = screen.getByTestId('generate-all-sections-button');
      expect(button).toHaveTextContent('Generate All (3)');
    });

    it('shows reduced count when some sections exist', () => {
      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity']}
        />
      );

      const button = screen.getByTestId('generate-all-sections-button');
      expect(button).toHaveTextContent('Generate All (2)');
    });

    it('shows count of 1 when two sections exist', () => {
      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity', 'competitive_positioning']}
        />
      );

      const button = screen.getByTestId('generate-all-sections-button');
      expect(button).toHaveTextContent('Generate All (1)');
    });

    it('returns null when all sections exist and skipExisting is true', () => {
      const { container } = render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity', 'competitive_positioning', 'trend_alignment']}
          skipExisting={true}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('shows all sections when skipExisting is false', () => {
      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity', 'competitive_positioning']}
          skipExisting={false}
        />
      );

      const button = screen.getByTestId('generate-all-sections-button');
      expect(button).toHaveTextContent('Generate All (3)');
    });
  });

  describe('click behavior', () => {
    it('calls mutateAsync for each section sequentially', async () => {
      const user = userEvent.setup();

      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={[]}
        />
      );

      await user.click(screen.getByTestId('generate-all-sections-button'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(3);
      });

      expect(mockMutateAsync).toHaveBeenNthCalledWith(1, {
        pitchDraftId: 'd1',
        sectionType: 'market_opportunity',
      });
      expect(mockMutateAsync).toHaveBeenNthCalledWith(2, {
        pitchDraftId: 'd1',
        sectionType: 'competitive_positioning',
      });
      expect(mockMutateAsync).toHaveBeenNthCalledWith(3, {
        pitchDraftId: 'd1',
        sectionType: 'trend_alignment',
      });
    });

    it('skips existing sections', async () => {
      const user = userEvent.setup();

      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity']}
        />
      );

      await user.click(screen.getByTestId('generate-all-sections-button'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(2);
      });

      expect(mockMutateAsync).toHaveBeenNthCalledWith(1, {
        pitchDraftId: 'd1',
        sectionType: 'competitive_positioning',
      });
      expect(mockMutateAsync).toHaveBeenNthCalledWith(2, {
        pitchDraftId: 'd1',
        sectionType: 'trend_alignment',
      });
    });

    it('calls onComplete after all generations finish', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity', 'competitive_positioning']}
          onComplete={onComplete}
        />
      );

      await user.click(screen.getByTestId('generate-all-sections-button'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('continues to next section even if one fails', async () => {
      const user = userEvent.setup();
      mockMutateAsync
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={[]}
        />
      );

      await user.click(screen.getByTestId('generate-all-sections-button'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('loading state', () => {
    it('shows loading text while generating', async () => {
      const user = userEvent.setup();
      // Make mutation take time
      mockMutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={['market_opportunity', 'competitive_positioning']}
        />
      );

      await user.click(screen.getByTestId('generate-all-sections-button'));

      // Button should show loading state
      expect(screen.getByTestId('generate-all-sections-button')).toHaveTextContent('Generating...');
    });

    it('is disabled while generating', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={[]}
        />
      );

      await user.click(screen.getByTestId('generate-all-sections-button'));

      expect(screen.getByTestId('generate-all-sections-button')).toBeDisabled();
    });
  });

  describe('custom className', () => {
    it('applies custom className to button', () => {
      render(
        <GenerateAllSectionsButton
          pitchDraftId="d1"
          existingSections={[]}
          className="custom-button-class"
        />
      );

      expect(screen.getByTestId('generate-all-sections-button')).toHaveClass('custom-button-class');
    });
  });
});
