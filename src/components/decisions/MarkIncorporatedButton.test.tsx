import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkIncorporatedButton } from './MarkIncorporatedButton';

// Mock useMarkIncorporated hook
const mockMarkIncorporated = vi.fn();
const mockUseMarkIncorporated = vi.fn();
vi.mock('@/hooks/decisions/useMarkIncorporated', () => ({
  useMarkIncorporated: () => mockUseMarkIncorporated(),
}));

// Mock useHaptic
vi.mock('@/hooks/ui', () => ({
  useHaptic: () => ({ trigger: vi.fn() }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('MarkIncorporatedButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMarkIncorporated.mockReturnValue({
      markIncorporated: mockMarkIncorporated,
      isPending: false,
      error: null,
      isSuccess: false,
    });
  });

  it('renders with correct test-id', () => {
    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByTestId('mark-incorporated-button')
    ).toBeInTheDocument();
  });

  it('shows "Mark Incorporated" text', () => {
    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByTestId('mark-incorporated-button')
    ).toHaveTextContent('Mark Incorporated');
  });

  it('calls markIncorporated on click', async () => {
    const user = userEvent.setup();

    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('mark-incorporated-button'));

    expect(mockMarkIncorporated).toHaveBeenCalledWith({
      decisionId: 'd-1',
      questionId: 'q-1',
    });
  });

  it('shows "Marking..." when pending', () => {
    mockUseMarkIncorporated.mockReturnValue({
      markIncorporated: mockMarkIncorporated,
      isPending: true,
      error: null,
      isSuccess: false,
    });

    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByTestId('mark-incorporated-button')
    ).toHaveTextContent('Marking...');
  });

  it('is disabled when pending', () => {
    mockUseMarkIncorporated.mockReturnValue({
      markIncorporated: mockMarkIncorporated,
      isPending: true,
      error: null,
      isSuccess: false,
    });

    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('mark-incorporated-button')).toBeDisabled();
  });

  it('has 48px touch target', () => {
    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByTestId('mark-incorporated-button');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('does not trigger mutation when clicked while pending (double-click protection)', async () => {
    const user = userEvent.setup();
    mockUseMarkIncorporated.mockReturnValue({
      markIncorporated: mockMarkIncorporated,
      isPending: true,
      error: null,
      isSuccess: false,
    });

    render(
      <MarkIncorporatedButton decisionId="d-1" questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    // Attempt to click the disabled button
    await user.click(screen.getByTestId('mark-incorporated-button'));

    // Mutation should NOT be called because button is disabled
    expect(mockMarkIncorporated).not.toHaveBeenCalled();
  });
});
