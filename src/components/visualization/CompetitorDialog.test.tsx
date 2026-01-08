import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { CompetitorDialog } from './CompetitorDialog';

import type { CompetitorDataPoint } from '@/types';

// Mock the hooks
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

const mockCompetitor: CompetitorDataPoint = {
  id: '1',
  name: 'Test Competitor',
  price_score: 7,
  quality_score: 8,
  category: 'Chips',
  notes: null,
  is_kel_position: false,
  created_by: 'user1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('CompetitorDialog', () => {
  it('renders in create mode when no editing competitor', () => {
    render(
      <CompetitorDialog
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('competitor-dialog')).toBeInTheDocument();
    // Use heading role to avoid matching button text
    expect(screen.getByRole('heading', { name: 'Add Competitor' })).toBeInTheDocument();
  });

  it('renders in edit mode with editing competitor', () => {
    render(
      <CompetitorDialog
        open={true}
        onOpenChange={vi.fn()}
        editingCompetitor={mockCompetitor}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('competitor-dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit Competitor' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CompetitorDialog
        open={false}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByTestId('competitor-dialog')).not.toBeInTheDocument();
  });
});
