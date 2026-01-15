/**
 * Tests for PitchExportPreviewDialog Component
 *
 * Story 18-3: Export with AI Summary
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PitchExportPreviewDialog } from './PitchExportPreviewDialog';

import type { PitchSectionWithSources } from '@/types/pitch';

// Mock the hooks
vi.mock('@/hooks/pitch', () => ({
  useGeneratePitchSummary: vi.fn(),
}));

vi.mock('@/hooks/visualization/usePdfExport', () => ({
  usePdfExport: vi.fn(),
}));

// Mock Recharts for PitchPdfExportContent
vi.mock('recharts', () => ({
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-scatter-chart">{children}</div>
  ),
  Scatter: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
}));

import { useGeneratePitchSummary } from '@/hooks/pitch';
import { usePdfExport } from '@/hooks/visualization/usePdfExport';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('PitchExportPreviewDialog', () => {
  const mockSections: PitchSectionWithSources[] = [
    {
      id: 'section-1',
      pitch_draft_id: 'draft-1',
      section_type: 'market_opportunity',
      content: 'The Philippine snack market is growing.',
      ai_generated: true,
      user_edited: false,
      confidence_score: 0.85,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      sources: [],
    },
  ];

  const mockMutate = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockExportToPdf = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: false,
      isError: false,
      data: null,
      error: null,
      reset: vi.fn(),
    });

    (usePdfExport as Mock).mockReturnValue({
      exportToPdf: mockExportToPdf,
      isGenerating: false,
      error: null,
    });
  });

  it('renders the dialog when open', () => {
    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('pitch-export-preview-dialog')).toBeInTheDocument();
    expect(screen.getByText('Export Pitch as PDF')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <PitchExportPreviewDialog
        open={false}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByTestId('pitch-export-preview-dialog')).not.toBeInTheDocument();
  });

  it('generates summary when opened', () => {
    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    expect(mockMutate).toHaveBeenCalledWith({ pitchDraftId: 'draft-1' });
  });

  it('shows loading state while generating summary', () => {
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: true,
      isSuccess: false,
      isError: false,
      data: null,
      error: null,
      reset: vi.fn(),
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Generating AI summary...')).toBeInTheDocument();
    expect(screen.getByTestId('export-pdf-button')).toBeDisabled();
  });

  it('shows preview content after summary is generated', () => {
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: {
        summary: 'This is an AI-generated executive summary.',
        metadata: { sections_analyzed: 3, model_used: 'claude' },
      },
      error: null,
      reset: vi.fn(),
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    // Two elements: visible preview and hidden export target
    const pdfContents = screen.getAllByTestId('pitch-pdf-export-content');
    expect(pdfContents).toHaveLength(2);
    // Summary text appears in both copies
    const summaryTexts = screen.getAllByText('This is an AI-generated executive summary.');
    expect(summaryTexts).toHaveLength(2);
  });

  it('shows error state when summary generation fails', () => {
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: false,
      isError: true,
      data: null,
      error: new Error('Failed to generate summary'),
      reset: vi.fn(),
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Failed to generate summary/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries summary generation when retry button clicked', () => {
    const mockReset = vi.fn();
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: false,
      isError: true,
      data: null,
      error: new Error('Failed'),
      reset: mockReset,
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    // Clear the initial call
    mockMutate.mockClear();

    fireEvent.click(screen.getByText('Retry'));

    expect(mockReset).toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledWith({ pitchDraftId: 'draft-1' });
  });

  it('calls exportToPdf when download button is clicked', async () => {
    mockExportToPdf.mockResolvedValue(undefined);

    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: {
        summary: 'Test summary',
        metadata: { sections_analyzed: 1, model_used: 'claude' },
      },
      error: null,
      reset: vi.fn(),
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    const downloadButton = screen.getByTestId('export-pdf-button');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockExportToPdf).toHaveBeenCalled();
    });
  });

  it('shows generating state while PDF is being created', () => {
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: {
        summary: 'Test summary',
        metadata: { sections_analyzed: 1, model_used: 'claude' },
      },
      error: null,
      reset: vi.fn(),
    });

    (usePdfExport as Mock).mockReturnValue({
      exportToPdf: mockExportToPdf,
      isGenerating: true,
      error: null,
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
    expect(screen.getByTestId('export-pdf-button')).toBeDisabled();
  });

  it('passes competitor data to preview content', () => {
    const competitors = [
      { id: 'comp-1', name: 'Oishi', price_score: 5, quality_score: 6, is_kel_position: false },
    ];
    const kelPosition = {
      id: 'kel-1',
      name: 'Kel',
      price_score: 4,
      quality_score: 8,
      is_kel_position: true,
    };

    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: {
        summary: 'Test summary',
        metadata: { sections_analyzed: 1, model_used: 'claude' },
      },
      error: null,
      reset: vi.fn(),
    });

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
        competitorData={competitors}
        kelPosition={kelPosition}
      />,
      { wrapper: createWrapper() }
    );

    // Two competitive landscape sections: visible preview and hidden export target
    const landscapes = screen.getAllByTestId('pitch-pdf-competitive-landscape');
    expect(landscapes).toHaveLength(2);
  });

  it('calls onOpenChange when dialog is closed', () => {
    const onOpenChange = vi.fn();

    render(
      <PitchExportPreviewDialog
        open={true}
        onOpenChange={onOpenChange}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    // Click the close button (X)
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets mutation state when dialog is reopened', () => {
    const mockReset = vi.fn();
    (useGeneratePitchSummary as Mock).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isSuccess: true,
      isError: false,
      data: { summary: 'Old summary', metadata: { sections_analyzed: 1, model_used: 'claude' } },
      error: null,
      reset: mockReset,
    });

    const { rerender } = render(
      <PitchExportPreviewDialog
        open={false}
        onOpenChange={() => {}}
        pitchDraftId="draft-1"
        pitchTitle="Test Pitch"
        sections={mockSections}
      />,
      { wrapper: createWrapper() }
    );

    // Reopen the dialog
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <PitchExportPreviewDialog
          open={true}
          onOpenChange={() => {}}
          pitchDraftId="draft-1"
          pitchTitle="Test Pitch"
          sections={mockSections}
        />
      </QueryClientProvider>
    );

    // Summary should be regenerated on reopen
    expect(mockMutate).toHaveBeenCalled();
  });
});
