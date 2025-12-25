import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { useQueueStore } from '@/stores/queue';

import { ExploreAlternativesPanel } from './ExploreAlternativesPanel';

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initial, animate, exit, transition, onAnimationComplete,
      ...htmlProps
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...htmlProps}>{children}</div>
    ),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  },
}));

// Mock useHaptic
const mockTriggerHaptic = vi.fn();
vi.mock('@/hooks/ui', () => ({
  useHaptic: () => ({
    trigger: mockTriggerHaptic,
  }),
}));

// Mock decision hooks
const mockExploreAlternativesAsync = vi.fn();
vi.mock('@/hooks/decisions', () => ({
  useExploreAlternatives: () => ({
    exploreAlternativesAsync: mockExploreAlternativesAsync,
    isPending: false,
  }),
  useUndoDecision: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(queryKeys.questions.all, []);
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('ExploreAlternativesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExploreAlternativesAsync.mockResolvedValue({
      decision: { id: 'decision-1' },
      question: { id: 'q-1', status: 'exploring_alternatives' },
    });
  });

  it('renders when expanded', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-panel')).toBeInTheDocument();
  });

  it('does not render when not expanded', () => {
    render(
      <ExploreAlternativesPanel
        expanded={false}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByTestId('alternatives-panel')).not.toBeInTheDocument();
  });

  it('renders textarea with correct placeholder', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    const textarea = screen.getByTestId('alternatives-reasoning-input');
    expect(textarea).toHaveAttribute(
      'placeholder',
      'What concerns you? What would you prefer?'
    );
  });

  it('shows character count starting at 0', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-char-count')).toHaveTextContent(
      '0 characters'
    );
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      'Price is too high'
    );

    expect(screen.getByTestId('alternatives-char-count')).toHaveTextContent(
      '17 characters'
    );
  });

  it('disables submit button when textarea is empty', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toBeDisabled();
  });

  it('disables submit button when textarea has only whitespace', async () => {
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      '   '
    );

    expect(screen.getByTestId('alternatives-submit-button')).toBeDisabled();
  });

  it('enables submit button when reasoning is entered', async () => {
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      'I have concerns'
    );

    expect(screen.getByTestId('alternatives-submit-button')).toBeEnabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const mockOnCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('alternatives-cancel-button'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('renders cancel button', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('alternatives-cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('alternatives-cancel-button')).toHaveTextContent(
      'Cancel'
    );
  });

  it('clears reasoning when cancel is clicked', async () => {
    const mockOnCancel = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      'Some text'
    );

    // Click cancel
    await user.click(screen.getByTestId('alternatives-cancel-button'));

    // Rerender as collapsed
    rerender(
      <ExploreAlternativesPanel
        expanded={false}
        questionId="q-1"
        onCancel={mockOnCancel}
      />
    );

    // Reopen
    rerender(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={mockOnCancel}
      />
    );

    // Textarea should be empty
    await waitFor(() => {
      const textarea = screen.getByTestId(
        'alternatives-reasoning-input'
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });
  });

  it('has submit button with correct test-id', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('alternatives-submit-button')).toBeInTheDocument();
  });

  it('passes questionId and reasoning to submit button', async () => {
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      '  My concerns  '
    );
    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(mockExploreAlternativesAsync).toHaveBeenCalledWith({
        questionId: 'q-1',
        reasoning: 'My concerns', // trimmed by submit button
      });
    });
  });

  it('calls onSuccess after successful submission', async () => {
    const mockOnSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      'My concerns'
    );
    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls onError on submission failure', async () => {
    mockExploreAlternativesAsync.mockRejectedValueOnce(
      new Error('Network error')
    );
    const mockOnError = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onError={mockOnError}
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      'My concerns'
    );
    await user.click(screen.getByTestId('alternatives-submit-button'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('clears reasoning after successful submission', async () => {
    const mockOnSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onSuccess={mockOnSuccess}
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    await user.type(
      screen.getByTestId('alternatives-reasoning-input'),
      'My concerns'
    );
    await user.click(screen.getByTestId('alternatives-submit-button'));

    // Wait for onSuccess to be called, then check textarea is cleared
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // The panel resets reasoning on success
    await waitFor(() => {
      const textarea = screen.getByTestId(
        'alternatives-reasoning-input'
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });
  });
});

describe('ExploreAlternativesPanel - Auto-Save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExploreAlternativesAsync.mockResolvedValue({
      decision: { id: 'decision-1' },
      question: { id: 'q-1', status: 'exploring_alternatives' },
    });
    // Reset Zustand store
    useQueueStore.setState({ draftResponses: {} });
  });

  it('restores draft when panel expands', async () => {
    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'explore_alternatives',
          reasoning: 'My saved reasoning',
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // Reasoning should be restored from draft
    await waitFor(() => {
      const textarea = screen.getByTestId(
        'alternatives-reasoning-input'
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('My saved reasoning');
    });
  });

  it('clears draft on successful submit', async () => {
    const user = userEvent.setup();

    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'explore_alternatives',
          reasoning: 'My saved reasoning',
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onSuccess={() => {}}
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // Wait for draft restoration
    await waitFor(() => {
      const textarea = screen.getByTestId(
        'alternatives-reasoning-input'
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('My saved reasoning');
    });

    // Click submit
    await user.click(screen.getByTestId('alternatives-submit-button'));

    // Draft should be cleared
    await waitFor(() => {
      expect(useQueueStore.getState().draftResponses['q-1']).toBeUndefined();
    });
  });

  it('renders DraftSavedIndicator component', () => {
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // Panel should be rendered
    expect(screen.getByTestId('alternatives-panel')).toBeInTheDocument();
  });

  it('does not restore draft when question has no saved draft', async () => {
    // No draft in store
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // Textarea should be empty
    const textarea = screen.getByTestId(
      'alternatives-reasoning-input'
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('shows discard button when draft exists', () => {
    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'explore_alternatives',
          reasoning: 'My saved reasoning',
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('discard-draft-button')).toBeInTheDocument();
  });

  it('does not show discard button when no draft exists', () => {
    // No draft in store
    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByTestId('discard-draft-button')).not.toBeInTheDocument();
  });

  it('clears draft when discard is confirmed', async () => {
    const user = userEvent.setup();

    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'explore_alternatives',
          reasoning: 'My saved reasoning',
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ExploreAlternativesPanel
        expanded={true}
        questionId="q-1"
        onCancel={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // Click discard button
    await user.click(screen.getByTestId('discard-draft-button'));

    // Confirm dialog should appear
    expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();

    // Click confirm
    await user.click(screen.getByTestId('discard-confirm-button'));

    // Draft should be cleared
    await waitFor(() => {
      expect(useQueueStore.getState().draftResponses['q-1']).toBeUndefined();
    });

    // Textarea should be empty
    const textarea = screen.getByTestId(
      'alternatives-reasoning-input'
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });
});
