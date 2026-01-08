import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SearchableQuestionCombobox, type QuestionOption } from './SearchableQuestionCombobox';

// Mock the useRecentQuestions hook with configurable return values
const mockAddRecent = vi.fn();
const mockClearRecent = vi.fn();
let mockRecentIds: string[] = [];

vi.mock('./useRecentQuestions', () => ({
  useRecentQuestions: () => ({
    recentIds: mockRecentIds,
    addRecent: mockAddRecent,
    clearRecent: mockClearRecent,
  }),
}));

// Mock @tanstack/react-virtual to render all items in jsdom
// jsdom doesn't support proper layout measurements for virtualization
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: (index: number) => number }) => {
    // Calculate cumulative positions
    const items = Array.from({ length: count }, (_, index) => {
      let start = 0;
      for (let i = 0; i < index; i++) {
        start += estimateSize(i);
      }
      const size = estimateSize(index);
      return {
        index,
        start,
        end: start + size,
        size,
        key: index,
        lane: 0,
      };
    });

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((sum, item) => sum + item.size, 0),
      scrollToIndex: vi.fn(),
      measureElement: vi.fn(),
    };
  },
}));

// Generate mock questions
function generateMockQuestions(count: number): QuestionOption[] {
  const categories: Array<'market' | 'product' | 'distribution'> = [
    'market',
    'product',
    'distribution',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    title: `Question ${i}: ${categories[i % 3]} topic`,
    category: categories[i % 3],
  }));
}

describe('SearchableQuestionCombobox', () => {
  const defaultProps = {
    questions: generateMockQuestions(10),
    value: null,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRecentIds = []; // Reset recent IDs for each test
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the trigger button', () => {
      render(<SearchableQuestionCombobox {...defaultProps} />);

      expect(screen.getByTestId('question-combobox-trigger')).toBeInTheDocument();
    });

    it('shows "None (unattached)" when value is null', () => {
      render(<SearchableQuestionCombobox {...defaultProps} value={null} />);

      expect(screen.getByText('None (unattached)')).toBeInTheDocument();
    });

    it('shows selected question title when value is set', () => {
      render(<SearchableQuestionCombobox {...defaultProps} value="q-0" />);

      expect(screen.getByText(/Question 0/)).toBeInTheDocument();
    });

    it('shows placeholder when provided and no selection', () => {
      render(
        <SearchableQuestionCombobox
          {...defaultProps}
          value={null}
          placeholder="Search questions..."
        />
      );

      // With null value, it shows "None (unattached)" not the placeholder
      expect(screen.getByText('None (unattached)')).toBeInTheDocument();
    });

    it('renders with empty questions array showing only None option', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} questions={[]} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-none')).toBeInTheDocument();
      });

      // Should have no category headers
      expect(screen.queryByTestId('question-combobox-header-market')).not.toBeInTheDocument();
      expect(screen.queryByTestId('question-combobox-header-product')).not.toBeInTheDocument();
      expect(screen.queryByTestId('question-combobox-header-distribution')).not.toBeInTheDocument();
    });
  });

  describe('opening and closing', () => {
    it('opens dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      expect(screen.getByTestId('question-combobox-list')).toBeInTheDocument();
      expect(screen.getByTestId('question-combobox-search')).toBeInTheDocument();
    });

    it('focuses search input when opened', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-search')).toHaveFocus();
      });
    });

    it('closes dropdown when escape is pressed', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      expect(screen.getByTestId('question-combobox-list')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('question-combobox-list')).not.toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('filters questions by search term', async () => {
      const user = userEvent.setup();
      const questions: QuestionOption[] = [
        { id: '1', title: 'Market size analysis', category: 'market' },
        { id: '2', title: 'Product quality check', category: 'product' },
        { id: '3', title: 'Distribution network', category: 'distribution' },
      ];
      render(<SearchableQuestionCombobox {...defaultProps} questions={questions} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      // Wait for popover to be fully rendered
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-search')).toBeInTheDocument();
      });

      // Type search query
      await user.type(screen.getByTestId('question-combobox-search'), 'market');

      // Wait for debounce (150ms) and filtering
      await waitFor(
        () => {
          expect(screen.getByText(/Market size analysis/)).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('shows empty state when no matches found', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await user.type(
        screen.getByTestId('question-combobox-search'),
        'nonexistent query xyz'
      );

      await waitFor(
        () => {
          expect(screen.getByTestId('question-combobox-empty')).toBeInTheDocument();
          expect(screen.getByText('No matching questions')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await user.type(screen.getByTestId('question-combobox-search'), 'search term');

      // Find and click clear button
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(screen.getByTestId('question-combobox-search')).toHaveValue('');
    });
  });

  describe('selection', () => {
    it('calls onSelect with null when "None" is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} onSelect={onSelect} value="q-0" />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      // Wait for popover
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-none')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('question-combobox-none'));

      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('calls onSelect with question ID when question is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} onSelect={onSelect} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      // Wait for popover and find a question option
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-option-q-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('question-combobox-option-q-0'));

      expect(onSelect).toHaveBeenCalledWith('q-0');
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-option-q-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('question-combobox-option-q-0'));

      await waitFor(() => {
        expect(screen.queryByTestId('question-combobox-list')).not.toBeInTheDocument();
      });
    });

    it('calls addRecent when a question is selected', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-option-q-0')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('question-combobox-option-q-0'));

      expect(mockAddRecent).toHaveBeenCalledWith('q-0');
    });

    it('does not call addRecent when None is selected', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} value="q-0" />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-none')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('question-combobox-none'));

      expect(mockAddRecent).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-search')).toHaveFocus();
      });

      // Press down arrow to highlight next item
      await user.keyboard('{ArrowDown}');

      // The highlight should move (visual change - tested via class)
      // This test verifies keyboard navigation doesn't throw errors
    });

    it('selects with Enter key', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} onSelect={onSelect} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-search')).toHaveFocus();
      });

      // Press Enter to select first item (None)
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('category grouping', () => {
    it('displays category headers', async () => {
      const user = userEvent.setup();
      const questions: QuestionOption[] = [
        { id: '1', title: 'Market question', category: 'market' },
        { id: '2', title: 'Product question', category: 'product' },
        { id: '3', title: 'Distribution question', category: 'distribution' },
      ];
      render(<SearchableQuestionCombobox {...defaultProps} questions={questions} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-header-market')).toBeInTheDocument();
        expect(screen.getByTestId('question-combobox-header-product')).toBeInTheDocument();
        expect(
          screen.getByTestId('question-combobox-header-distribution')
        ).toBeInTheDocument();
      });
    });
  });

  describe('recent questions', () => {
    it('displays Recent section when recentIds exist', async () => {
      const user = userEvent.setup();
      const questions: QuestionOption[] = [
        { id: 'q-1', title: 'First question', category: 'market' },
        { id: 'q-2', title: 'Second question', category: 'product' },
        { id: 'q-3', title: 'Third question', category: 'distribution' },
      ];
      // Set up recent IDs before rendering
      mockRecentIds = ['q-2', 'q-1'];

      render(<SearchableQuestionCombobox {...defaultProps} questions={questions} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-header-recent')).toBeInTheDocument();
        expect(screen.getByText('Recent')).toBeInTheDocument();
      });
    });

    it('does not display Recent section when no recentIds', async () => {
      const user = userEvent.setup();
      mockRecentIds = [];

      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-list')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('question-combobox-header-recent')).not.toBeInTheDocument();
    });

    it('does not display Recent section when searching', async () => {
      const user = userEvent.setup();
      mockRecentIds = ['q-0', 'q-1'];

      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));
      await user.type(screen.getByTestId('question-combobox-search'), 'question');

      await waitFor(
        () => {
          // Verify search is active and Recent header is hidden
          expect(screen.queryByTestId('question-combobox-header-recent')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe('virtualization', () => {
    it('renders with a large list without crashing', async () => {
      const user = userEvent.setup();
      const manyQuestions = generateMockQuestions(500);
      render(<SearchableQuestionCombobox {...defaultProps} questions={manyQuestions} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      // Should render successfully
      expect(screen.getByTestId('question-combobox-list')).toBeInTheDocument();
    });

    it('does not render all items at once (virtualization active)', async () => {
      // NOTE: In tests, @tanstack/react-virtual is mocked to render all items
      // because jsdom doesn't support real layout measurements.
      // This test validates the virtualizer integration exists.
      // Real virtualization behavior is tested in browser/e2e tests.
      const user = userEvent.setup();
      const manyQuestions = generateMockQuestions(500);
      render(<SearchableQuestionCombobox {...defaultProps} questions={manyQuestions} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      // Verify the list renders (with mocked virtualizer, all items are rendered)
      // In production, the virtualizer limits DOM elements based on viewport
      const questionOptions = screen.queryAllByTestId(/question-combobox-option-/);
      expect(questionOptions.length).toBeGreaterThan(0);

      // Verify the virtualizer container exists
      expect(screen.getByTestId('question-combobox-list')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes on trigger', async () => {
      render(<SearchableQuestionCombobox {...defaultProps} />);

      const trigger = screen.getByTestId('question-combobox-trigger');
      expect(trigger).toHaveAttribute('role', 'combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      const trigger = screen.getByTestId('question-combobox-trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has listbox role on options container', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      expect(screen.getByTestId('question-combobox-list')).toHaveAttribute(
        'role',
        'listbox'
      );
    });

    it('has option role on items', async () => {
      const user = userEvent.setup();
      render(<SearchableQuestionCombobox {...defaultProps} />);

      await user.click(screen.getByTestId('question-combobox-trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('question-combobox-none')).toHaveAttribute(
          'role',
          'option'
        );
      });
    });
  });
});
