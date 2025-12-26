/**
 * Unit Tests for KelPositionForm Component
 *
 * Tests form rendering, validation, and submission behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { KelPositionForm } from './KelPositionForm';

import type { CompetitorDataPoint } from '@/types';

// Mock the useSetKelPosition hook
vi.mock('@/hooks/competitors', () => ({
  useSetKelPosition: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('KelPositionForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const renderForm = (defaultValues?: CompetitorDataPoint) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <KelPositionForm
          defaultValues={defaultValues}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with sliders and notes field', () => {
    renderForm();

    expect(screen.getByTestId('kel-position-form')).toBeInTheDocument();
    expect(screen.getByTestId('kel-price-input')).toBeInTheDocument();
    expect(screen.getByTestId('kel-quality-input')).toBeInTheDocument();
    expect(screen.getByTestId('kel-notes-input')).toBeInTheDocument();
    expect(screen.getByTestId('kel-position-submit')).toBeInTheDocument();
  });

  it('renders with default values (5, 5) when no defaultValues provided', () => {
    renderForm();

    expect(screen.getByText(/Price Score: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Quality Score: 5/i)).toBeInTheDocument();
  });

  it('renders with existing position values when provided', () => {
    const existingPosition: CompetitorDataPoint = {
      id: 'kel-1',
      name: "Kel's Target Position",
      price_score: 7,
      quality_score: 8,
      category: null,
      notes: 'Test notes',
      is_kel_position: true,
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    renderForm(existingPosition);

    expect(screen.getByText(/Price Score: 7/i)).toBeInTheDocument();
    expect(screen.getByText(/Quality Score: 8/i)).toBeInTheDocument();
    expect(screen.getByTestId('kel-notes-input')).toHaveValue('Test notes');
  });

  it('submit button says "Set Position"', () => {
    renderForm();

    const submitButton = screen.getByTestId('kel-position-submit');
    expect(submitButton).toHaveTextContent('Set Position');
  });

  it('submit button is disabled when isPending', () => {
    // Re-mock with isPending=true
    vi.mocked(vi.fn()).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    renderForm();

    const submitButton = screen.getByTestId('kel-position-submit');
    // Form starts valid with default values (5, 5)
    // But isPending should disable it
    expect(submitButton).toBeDisabled();
  });

  it('cancel button calls onCancel', async () => {
    const user = userEvent.setup();
    renderForm();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledOnce();
  });

  it('validates price score is between 1-10', () => {
    // Test the kelPositionFormSchema directly
    const { kelPositionFormSchema } = require('./kelPositionSchema');

    // Valid scores
    expect(() => kelPositionFormSchema.parse({ price_score: 1, quality_score: 5 })).not.toThrow();
    expect(() => kelPositionFormSchema.parse({ price_score: 10, quality_score: 5 })).not.toThrow();
    expect(() => kelPositionFormSchema.parse({ price_score: 5, quality_score: 5 })).not.toThrow();

    // Invalid scores - below minimum
    expect(() => kelPositionFormSchema.parse({ price_score: 0, quality_score: 5 })).toThrow('Minimum is 1');
    expect(() => kelPositionFormSchema.parse({ price_score: -1, quality_score: 5 })).toThrow();

    // Invalid scores - above maximum
    expect(() => kelPositionFormSchema.parse({ price_score: 11, quality_score: 5 })).toThrow('Maximum is 10');
    expect(() => kelPositionFormSchema.parse({ price_score: 100, quality_score: 5 })).toThrow();
  });

  it('validates quality score is between 1-10', () => {
    const { kelPositionFormSchema } = require('./kelPositionSchema');

    // Valid scores
    expect(() => kelPositionFormSchema.parse({ price_score: 5, quality_score: 1 })).not.toThrow();
    expect(() => kelPositionFormSchema.parse({ price_score: 5, quality_score: 10 })).not.toThrow();

    // Invalid scores - below minimum
    expect(() => kelPositionFormSchema.parse({ price_score: 5, quality_score: 0 })).toThrow('Minimum is 1');

    // Invalid scores - above maximum
    expect(() => kelPositionFormSchema.parse({ price_score: 5, quality_score: 11 })).toThrow('Maximum is 10');
  });

  it('validates notes length (max 500 characters)', () => {
    const { kelPositionFormSchema } = require('./kelPositionSchema');

    // Valid notes
    expect(() =>
      kelPositionFormSchema.parse({ price_score: 5, quality_score: 5, notes: 'Short note' })
    ).not.toThrow();

    // Notes exactly at limit
    const maxNotes = 'a'.repeat(500);
    expect(() =>
      kelPositionFormSchema.parse({ price_score: 5, quality_score: 5, notes: maxNotes })
    ).not.toThrow();

    // Notes over limit
    const tooLongNotes = 'a'.repeat(501);
    expect(() =>
      kelPositionFormSchema.parse({ price_score: 5, quality_score: 5, notes: tooLongNotes })
    ).toThrow('Notes too long');
  });
});
