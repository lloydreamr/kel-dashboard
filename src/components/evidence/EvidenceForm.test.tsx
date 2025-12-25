import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceForm } from './EvidenceForm';

// Mock hooks
const mockMutate = vi.fn();

vi.mock('@/hooks/evidence/useAddEvidence', () => ({
  useAddEvidence: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('EvidenceForm', () => {
  const defaultProps = {
    questionId: 'q1',
    userId: 'user1',
    onCancel: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<EvidenceForm {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByTestId('evidence-form')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-anchor-input')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-excerpt-input')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-submit')).toBeInTheDocument();
  });

  it('disables submit button when required fields empty', () => {
    render(<EvidenceForm {...defaultProps} />, { wrapper: TestWrapper });

    const submitButton = screen.getByTestId('evidence-submit');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when required fields filled', async () => {
    const user = userEvent.setup();
    render(<EvidenceForm {...defaultProps} />, { wrapper: TestWrapper });

    await user.type(screen.getByTestId('evidence-title-input'), 'Test Title');
    await user.type(
      screen.getByTestId('evidence-url-input'),
      'https://example.com'
    );

    await waitFor(() => {
      expect(screen.getByTestId('evidence-submit')).not.toBeDisabled();
    });
  });

  it('shows validation error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<EvidenceForm {...defaultProps} />, { wrapper: TestWrapper });

    await user.type(screen.getByTestId('evidence-title-input'), 'Test');
    await user.type(screen.getByTestId('evidence-url-input'), 'not-a-url');
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(
        screen.getByText('Invalid URL. Must be http:// or https://')
      ).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<EvidenceForm {...defaultProps} onCancel={onCancel} />, {
      wrapper: TestWrapper,
    });

    await user.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('has correct placeholders', () => {
    render(<EvidenceForm {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByTestId('evidence-anchor-input')).toHaveAttribute(
      'placeholder',
      '#section-name'
    );
    expect(screen.getByTestId('evidence-excerpt-input')).toHaveAttribute(
      'placeholder',
      'What does this source prove?'
    );
  });

  it('calls addEvidence with correct data on submit', async () => {
    const user = userEvent.setup();
    render(<EvidenceForm {...defaultProps} />, { wrapper: TestWrapper });

    await user.type(
      screen.getByTestId('evidence-title-input'),
      'Market Research Report'
    );
    await user.type(
      screen.getByTestId('evidence-url-input'),
      'https://example.com/report'
    );
    await user.type(
      screen.getByTestId('evidence-anchor-input'),
      '#pricing-section'
    );
    await user.type(
      screen.getByTestId('evidence-excerpt-input'),
      'Key finding about pricing'
    );

    await waitFor(() => {
      expect(screen.getByTestId('evidence-submit')).not.toBeDisabled();
    });

    await user.click(screen.getByTestId('evidence-submit'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          title: 'Market Research Report',
          url: 'https://example.com/report',
          section_anchor: '#pricing-section',
          excerpt: 'Key finding about pricing',
          created_by: 'user1',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  it('calls onSuccess after successful submission', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    // Mock mutate to call onSuccess callback
    mockMutate.mockImplementation((_data, options) => {
      options?.onSuccess?.();
    });

    render(<EvidenceForm {...defaultProps} onSuccess={onSuccess} />, {
      wrapper: TestWrapper,
    });

    await user.type(screen.getByTestId('evidence-title-input'), 'Test');
    await user.type(
      screen.getByTestId('evidence-url-input'),
      'https://example.com'
    );

    await waitFor(() => {
      expect(screen.getByTestId('evidence-submit')).not.toBeDisabled();
    });

    await user.click(screen.getByTestId('evidence-submit'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
