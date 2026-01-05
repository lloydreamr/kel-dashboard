import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCreateQuestion } from '@/hooks/questions/useCreateQuestion';

import { QuestionForm } from './QuestionForm';

// Mock the useCreateQuestion hook
const mockMutate = vi.fn();
vi.mock('@/hooks/questions/useCreateQuestion', () => ({
  useCreateQuestion: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('QuestionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    vi.mocked(useCreateQuestion).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateQuestion>);
  });

  it('renders all form fields with correct test IDs', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('question-form')).toBeInTheDocument();
    expect(screen.getByTestId('question-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('question-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('question-category-select')).toBeInTheDocument();
    expect(screen.getByTestId('question-submit')).toBeInTheDocument();
  });

  it('has title input focused on mount', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const titleInput = screen.getByTestId('question-title-input');
    expect(titleInput).toHaveFocus();
  });

  it('disables submit button when title is empty', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const submitButton = screen.getByTestId('question-submit');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when title AND category are filled', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    await user.type(screen.getByTestId('question-title-input'), 'Test Question');
    await user.selectOptions(screen.getByTestId('question-category-select'), 'product');

    await waitFor(() => {
      expect(screen.getByTestId('question-submit')).toBeEnabled();
    });
  });

  it('shows validation error for empty title after blur', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const titleInput = screen.getByTestId('question-title-input');
    await user.click(titleInput);
    await user.type(titleInput, 'a');
    await user.clear(titleInput);
    await user.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('initializes with no category selected (placeholder)', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const categorySelect = screen.getByTestId(
      'question-category-select'
    ) as HTMLSelectElement;
    expect(categorySelect.value).toBe('');
  });

  it('shows placeholder text in category select', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    expect(screen.getByText('Select category...')).toBeInTheDocument();
  });

  it('disables submit when category not selected', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    // Fill title but NOT category
    await user.type(screen.getByTestId('question-title-input'), 'Test Question');

    // Submit should still be disabled because category is empty
    expect(screen.getByTestId('question-submit')).toBeDisabled();
  });

  it('enables submit when both title and category are filled', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    await user.type(screen.getByTestId('question-title-input'), 'Test Question');
    await user.selectOptions(screen.getByTestId('question-category-select'), 'market');

    await waitFor(() => {
      expect(screen.getByTestId('question-submit')).toBeEnabled();
    });
  });

  it('keeps submit disabled after category touched but not selected', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    // Fill title first
    await user.type(screen.getByTestId('question-title-input'), 'Test Question');

    // Focus and blur the category select without selecting
    const categorySelect = screen.getByTestId('question-category-select');
    await user.click(categorySelect);
    await user.tab(); // Blur without selecting

    // Submit should remain disabled - this IS the validation feedback
    // Note: Error message doesn't appear until field value changes (react-hook-form onChange mode)
    expect(screen.getByTestId('question-submit')).toBeDisabled();
    expect(categorySelect).toHaveValue('');
  });

  it('allows selecting different categories', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const categorySelect = screen.getByTestId('question-category-select');
    await user.selectOptions(categorySelect, 'market');

    expect(categorySelect).toHaveValue('market');
  });

  it('calls mutation with correct data on submit', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    await user.type(
      screen.getByTestId('question-title-input'),
      'Test Question'
    );
    await user.type(
      screen.getByTestId('question-description-input'),
      'Test description'
    );
    await user.selectOptions(
      screen.getByTestId('question-category-select'),
      'market'
    );
    await user.click(screen.getByTestId('question-submit'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Question',
          description: 'Test description',
          category: 'market',
          created_by: 'user-123',
        }),
        expect.any(Object)
      );
    });
  });

  it('shows skeleton during loading', () => {
    // Re-mock with isPending: true
    vi.mocked(useCreateQuestion).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateQuestion>);

    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('question-form-skeleton')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const mockOnCancel = vi.fn();
    const user = userEvent.setup();

    render(<QuestionForm userId="user-123" onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not show cancel button when onCancel not provided', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument();
  });

  it('renders category options: Market, Product, Distribution', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const categorySelect = screen.getByTestId('question-category-select');
    const options = categorySelect.querySelectorAll('option');

    // Should have 4 options: placeholder + 3 categories
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue('');
    expect(options[0]).toHaveTextContent('Select category...');
    expect(options[1]).toHaveValue('market');
    expect(options[1]).toHaveTextContent('Market');
    expect(options[2]).toHaveValue('product');
    expect(options[2]).toHaveTextContent('Product');
    expect(options[3]).toHaveValue('distribution');
    expect(options[3]).toHaveTextContent('Distribution');
  });
});
