/**
 * Unit Tests for KelPositionDialog Component
 *
 * Tests dialog rendering, title changes, and prefilled values.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { KelPositionDialog } from './KelPositionDialog';

import type { CompetitorDataPoint } from '@/types';

// Mock the useSetKelPosition hook
vi.mock('@/hooks/competitors', () => ({
  useSetKelPosition: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('KelPositionDialog', () => {
  const mockOnOpenChange = vi.fn();

  const renderDialog = (open: boolean, existingPosition?: CompetitorDataPoint) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <KelPositionDialog
          open={open}
          onOpenChange={mockOnOpenChange}
          existingPosition={existingPosition}
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with title "Set Kel\'s Target Position" when no existing position', () => {
    renderDialog(true);

    expect(screen.getByTestId('kel-position-dialog')).toBeInTheDocument();
    expect(screen.getByText("Set Kel's Target Position")).toBeInTheDocument();
  });

  it('renders with title "Update Kel\'s Position" when existing position provided', () => {
    const existingPosition: CompetitorDataPoint = {
      id: 'kel-1',
      name: "Kel's Target Position",
      price_score: 7,
      quality_score: 8,
      category: null,
      notes: null,
      is_kel_position: true,
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderDialog(true, existingPosition);

    expect(screen.getByText("Update Kel's Position")).toBeInTheDocument();
  });

  it('prefills form values when editing existing position', () => {
    const existingPosition: CompetitorDataPoint = {
      id: 'kel-1',
      name: "Kel's Target Position",
      price_score: 7,
      quality_score: 8,
      category: null,
      notes: 'Target area',
      is_kel_position: true,
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderDialog(true, existingPosition);

    expect(screen.getByText(/Price Score: 7/i)).toBeInTheDocument();
    expect(screen.getByText(/Quality Score: 8/i)).toBeInTheDocument();
    expect(screen.getByTestId('kel-notes-input')).toHaveValue('Target area');
  });

  it('does not render when open=false', () => {
    renderDialog(false);

    expect(screen.queryByTestId('kel-position-dialog')).not.toBeInTheDocument();
  });
});
