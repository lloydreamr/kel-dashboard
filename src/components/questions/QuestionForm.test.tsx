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

  it('enables submit button when title is filled', async () => {
    const user = userEvent.setup();
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    await user.type(screen.getByTestId('question-title-input'), 'Test Question');

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

  it('has default category set to product', () => {
    render(<QuestionForm userId="user-123" />, { wrapper: createWrapper() });

    const categorySelect = screen.getByTestId(
      'question-category-select'
    ) as HTMLSelectElement;
    expect(categorySelect.value).toBe('product');
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

    expect(categorySelect).toContainHTML('<option value="market">Market</option>');
    expect(categorySelect).toContainHTML('<option value="product">Product</option>');
    expect(categorySelect).toContainHTML('<option value="distribution">Distribution</option>');
  });
});
