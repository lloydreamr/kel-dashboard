import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MarkCurrentButton } from './MarkCurrentButton';

// Mock the hook
const mockMutate = vi.fn();
let mockIsPending = false;

vi.mock('@/hooks/questions/useMarkQuestionCurrent', () => ({
  useMarkQuestionCurrent: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('MarkCurrentButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  describe('conditional rendering', () => {
    it('renders nothing when data is not stale', () => {
      const freshDate = new Date().toISOString();
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={freshDate} />,
        { wrapper: createWrapper() }
      );
      expect(screen.queryByTestId('mark-current-button')).not.toBeInTheDocument();
    });

    it('renders nothing when updatedAt is null', () => {
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={null} />,
        { wrapper: createWrapper() }
      );
      expect(screen.queryByTestId('mark-current-button')).not.toBeInTheDocument();
    });

    it('renders nothing when updatedAt is undefined', () => {
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={undefined} />,
        { wrapper: createWrapper() }
      );
      expect(screen.queryByTestId('mark-current-button')).not.toBeInTheDocument();
    });

    it('renders button when data is stale (> 14 days old)', () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 20);
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate.toISOString()} />,
        { wrapper: createWrapper() }
      );
      expect(screen.getByTestId('mark-current-button')).toBeInTheDocument();
    });
  });

  describe('button behavior', () => {
    const staleDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 20);
      return d.toISOString();
    })();

    it('calls markCurrent mutation with questionId on click', async () => {
      const user = userEvent.setup();
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('mark-current-button'));

      expect(mockMutate).toHaveBeenCalledWith('q-123');
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('displays "Mark as Current" text', () => {
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate} />,
        { wrapper: createWrapper() }
      );
      expect(screen.getByText('Mark as Current')).toBeInTheDocument();
    });

    it('has correct test ID', () => {
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate} />,
        { wrapper: createWrapper() }
      );
      expect(screen.getByTestId('mark-current-button')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    const staleDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 20);
      return d.toISOString();
    })();

    it('disables button when isPending is true', async () => {
      mockIsPending = true;
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTestId('mark-current-button')).toBeDisabled();
      });
    });

    it('shows spinner icon when isPending is true', async () => {
      mockIsPending = true;
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate} />,
        { wrapper: createWrapper() }
      );

      // The Loader2 component has animate-spin class
      const button = screen.getByTestId('mark-current-button');
      const spinnerIcon = button.querySelector('.animate-spin');
      expect(spinnerIcon).toBeInTheDocument();
    });

    it('shows CheckCircle icon when not pending', () => {
      mockIsPending = false;
      render(
        <MarkCurrentButton questionId="q-123" updatedAt={staleDate} />,
        { wrapper: createWrapper() }
      );

      // CheckCircle should be present (no animate-spin)
      const button = screen.getByTestId('mark-current-button');
      const spinnerIcon = button.querySelector('.animate-spin');
      expect(spinnerIcon).not.toBeInTheDocument();
    });
  });
});
