import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EvidenceSection } from './EvidenceSection';

// Mock hooks
vi.mock('@/hooks/evidence/useAddEvidence', () => ({
  useAddEvidence: () => ({
    mutate: vi.fn(),
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

describe('EvidenceSection', () => {
  it('renders add button when canAdd is true', () => {
    render(
      <EvidenceSection questionId="q1" userId="user1" canAdd={true} />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByTestId('add-evidence-button')).toBeInTheDocument();
  });

  it('renders nothing when canAdd is false', () => {
    render(
      <EvidenceSection questionId="q1" userId="user1" canAdd={false} />,
      { wrapper: TestWrapper }
    );

    expect(screen.queryByTestId('add-evidence-button')).not.toBeInTheDocument();
  });

  it('shows form when add button clicked', async () => {
    const user = userEvent.setup();
    render(
      <EvidenceSection questionId="q1" userId="user1" canAdd={true} />,
      { wrapper: TestWrapper }
    );

    await user.click(screen.getByTestId('add-evidence-button'));

    expect(screen.getByTestId('evidence-form')).toBeInTheDocument();
    expect(screen.queryByTestId('add-evidence-button')).not.toBeInTheDocument();
  });

  it('hides form when cancel clicked', async () => {
    const user = userEvent.setup();
    render(
      <EvidenceSection questionId="q1" userId="user1" canAdd={true} />,
      { wrapper: TestWrapper }
    );

    await user.click(screen.getByTestId('add-evidence-button'));
    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByTestId('evidence-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-evidence-button')).toBeInTheDocument();
  });
});
