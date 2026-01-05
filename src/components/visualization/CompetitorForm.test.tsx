import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CompetitorForm } from './CompetitorForm';
import { createMockCompetitor } from '@/test/factories';

// Mock the hooks - both must return valid mutation objects
vi.mock('@/hooks/competitors', () => ({
  useCreateCompetitor: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateCompetitor: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Use factory with specific overrides for form testing
const mockCompetitor = createMockCompetitor({
  id: '1',
  name: 'Test Competitor',
  price_score: 7,
  quality_score: 8,
  category: 'Chips',
  notes: 'Test notes',
});

describe('CompetitorForm', () => {
  it('renders all form fields', async () => {
    const { useCreateCompetitor } = vi.mocked(await import('@/hooks/competitors'));
    useCreateCompetitor.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <CompetitorForm
        mode="create"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('competitor-form')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-price-input')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-quality-input')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-category-select')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-notes-input')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-kel-position-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('competitor-submit')).toBeInTheDocument();
  });

  it('disables submit when name is empty and enables when filled', async () => {
    const user = userEvent.setup();
    const { useCreateCompetitor } = vi.mocked(await import('@/hooks/competitors'));
    useCreateCompetitor.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <CompetitorForm
        mode="create"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByTestId('competitor-submit');
    const nameInput = screen.getByTestId('competitor-name-input');

    // Button is disabled when form is invalid (empty name)
    expect(submitButton).toBeDisabled();

    // Fill in name - button should become enabled
    await user.type(nameInput, 'Test Competitor');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Clear name - button should be disabled again
    await user.clear(nameInput);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('submits form with valid data in create mode', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    const onSuccess = vi.fn();
    const { useCreateCompetitor } = vi.mocked(await import('@/hooks/competitors'));
    useCreateCompetitor.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    render(
      <CompetitorForm
        mode="create"
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByTestId('competitor-name-input');
    await user.type(nameInput, 'New Competitor');

    const submitButton = screen.getByTestId('competitor-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('disables submit button when form is invalid or pending', async () => {
    const { useCreateCompetitor } = vi.mocked(await import('@/hooks/competitors'));
    useCreateCompetitor.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(
      <CompetitorForm
        mode="create"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByTestId('competitor-submit');
    expect(submitButton).toBeDisabled();
  });

  it('pre-fills form in edit mode', async () => {
    const { useUpdateCompetitor } = vi.mocked(await import('@/hooks/competitors'));
    useUpdateCompetitor.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <CompetitorForm
        mode="edit"
        defaultValues={mockCompetitor}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByTestId('competitor-name-input') as HTMLInputElement;
    expect(nameInput.value).toBe('Test Competitor');
  });
});
