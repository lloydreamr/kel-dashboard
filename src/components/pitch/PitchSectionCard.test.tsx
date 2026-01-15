import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { PitchSectionCard } from './PitchSectionCard';

import type { PitchSectionWithSources } from '@/types/pitch';

// Mock hooks
const mockMutate = vi.fn();
let mockIsPending = false;

vi.mock('@/hooks/pitch', () => ({
  useUpdatePitchSection: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
  useGeneratePitchContent: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
  getGenerationState: () => ({
    isGenerating: false,
    generatingSectionType: undefined,
  }),
}));

function createMockSection(overrides: Partial<PitchSectionWithSources> = {}): PitchSectionWithSources {
  return {
    id: 's1',
    pitch_draft_id: 'd1',
    section_type: 'market_opportunity',
    content: 'Test content for market opportunity section.',
    ai_generated: true,
    user_edited: false,
    confidence_score: 0.85,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    sources: [],
    ...overrides,
  };
}

describe('PitchSectionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  describe('rendering', () => {
    it('renders section with correct label', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ section_type: 'market_opportunity' })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
    });

    it('renders section description', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ section_type: 'market_opportunity' })}
          pitchDraftId="d1"
        />
      );

      expect(
        screen.getByText('Market size, growth potential, and white space opportunities')
      ).toBeInTheDocument();
    });

    it('renders section content', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Custom test content' })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByTestId('section-content')).toHaveTextContent('Custom test content');
    });

    it('renders empty content message when no content', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ content: '' })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByText(/No content yet/)).toBeInTheDocument();
    });

    it('has correct test id based on section type', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ section_type: 'competitive_positioning' })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByTestId('pitch-section-competitive_positioning')).toBeInTheDocument();
    });
  });

  describe('badges', () => {
    it('shows AI Generated badge when ai_generated is true', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ ai_generated: true })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });

    it('does not show AI Generated badge when ai_generated is false', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ ai_generated: false })}
          pitchDraftId="d1"
        />
      );

      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument();
    });

    it('shows Edited badge when user_edited is true', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ user_edited: true })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByText('Edited')).toBeInTheDocument();
    });

    it('shows both badges when both are true', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ ai_generated: true, user_edited: true })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('Edited')).toBeInTheDocument();
    });
  });

  describe('confidence badge', () => {
    it('shows confidence badge with score', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ confidence_score: 0.85 })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByTestId('confidence-badge')).toHaveTextContent('85%');
    });
  });

  describe('sources', () => {
    it('renders sources list when sources exist', () => {
      const section = createMockSection({
        sources: [
          { id: 'src1', source_type: 'companies', source_id: 'c1', relevance_score: 0.9 },
          { id: 'src2', source_type: 'trends', source_id: 't1', relevance_score: 0.8 },
        ],
      });

      render(<PitchSectionCard section={section} pitchDraftId="d1" />);

      expect(screen.getByTestId('sources-list')).toBeInTheDocument();
      expect(screen.getByText('Sources (2)')).toBeInTheDocument();
    });

    it('does not render sources list when no sources', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ sources: [] })}
          pitchDraftId="d1"
        />
      );

      expect(screen.queryByTestId('sources-list')).not.toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('shows Edit Content button when editable and has content', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Some content' })}
          pitchDraftId="d1"
          editable={true}
        />
      );

      expect(screen.getByText('Edit Content')).toBeInTheDocument();
    });

    it('hides Edit Content button when not editable', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Some content' })}
          pitchDraftId="d1"
          editable={false}
        />
      );

      expect(screen.queryByText('Edit Content')).not.toBeInTheDocument();
    });

    it('hides Edit Content button when content is empty', () => {
      render(
        <PitchSectionCard
          section={createMockSection({ content: '' })}
          pitchDraftId="d1"
          editable={true}
        />
      );

      expect(screen.queryByText('Edit Content')).not.toBeInTheDocument();
    });

    it('enters edit mode when Edit Content is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Original content' })}
          pitchDraftId="d1"
        />
      );

      await user.click(screen.getByText('Edit Content'));

      expect(screen.getByTestId('section-content-editor')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('shows content in textarea when editing', async () => {
      const user = userEvent.setup();

      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Original content' })}
          pitchDraftId="d1"
        />
      );

      await user.click(screen.getByText('Edit Content'));

      const textarea = screen.getByTestId('section-content-editor');
      expect(textarea).toHaveValue('Original content');
    });

    it('cancels editing and restores content', async () => {
      const user = userEvent.setup();

      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Original content' })}
          pitchDraftId="d1"
        />
      );

      await user.click(screen.getByText('Edit Content'));

      const textarea = screen.getByTestId('section-content-editor');
      await user.clear(textarea);
      await user.type(textarea, 'Modified content');

      await user.click(screen.getByText('Cancel'));

      // Should exit edit mode
      expect(screen.queryByTestId('section-content-editor')).not.toBeInTheDocument();
      // Content should show original (component state resets)
      expect(screen.getByTestId('section-content')).toHaveTextContent('Original content');
    });

    it('saves content when Save is clicked and content changed', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      mockMutate.mockImplementation((_params, options) => {
        options?.onSuccess?.();
      });

      render(
        <PitchSectionCard
          section={createMockSection({ id: 's1', content: 'Original' })}
          pitchDraftId="d1"
          onEdit={onEdit}
        />
      );

      await user.click(screen.getByText('Edit Content'));

      const textarea = screen.getByTestId('section-content-editor');
      await user.clear(textarea);
      await user.type(textarea, 'Modified content');

      await user.click(screen.getByText('Save'));

      expect(mockMutate).toHaveBeenCalledWith(
        {
          id: 's1',
          updates: { content: 'Modified content', user_edited: true },
          pitchDraftId: 'd1',
        },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it('does not call mutation when content unchanged', async () => {
      const user = userEvent.setup();

      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Original content' })}
          pitchDraftId="d1"
        />
      );

      await user.click(screen.getByText('Edit Content'));
      await user.click(screen.getByText('Save'));

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('calls onEdit callback after successful save', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      mockMutate.mockImplementation((_params, options) => {
        options?.onSuccess?.();
      });

      render(
        <PitchSectionCard
          section={createMockSection({ content: 'Original' })}
          pitchDraftId="d1"
          onEdit={onEdit}
        />
      );

      await user.click(screen.getByText('Edit Content'));

      const textarea = screen.getByTestId('section-content-editor');
      await user.clear(textarea);
      await user.type(textarea, 'New content');

      await user.click(screen.getByText('Save'));

      expect(onEdit).toHaveBeenCalledWith('New content');
    });
  });

  describe('different section types', () => {
    it.each([
      ['market_opportunity', 'Market Opportunity'],
      ['competitive_positioning', 'Competitive Positioning'],
      ['trend_alignment', 'Trend Alignment'],
    ] as const)('renders %s section with label %s', (sectionType, expectedLabel) => {
      render(
        <PitchSectionCard
          section={createMockSection({ section_type: sectionType })}
          pitchDraftId="d1"
        />
      );

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      expect(screen.getByTestId(`pitch-section-${sectionType}`)).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className to card', () => {
      render(
        <PitchSectionCard
          section={createMockSection()}
          pitchDraftId="d1"
          className="custom-card-class"
        />
      );

      expect(screen.getByTestId('pitch-section-market_opportunity')).toHaveClass('custom-card-class');
    });
  });
});
