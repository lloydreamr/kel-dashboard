/**
 * Tests for useGeneratePitchSummary Hook
 *
 * Story 18-3: Export with AI Summary
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import { useGeneratePitchSummary } from './useGeneratePitchSummary';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

/**
 * Create a wrapper for TanStack Query
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useGeneratePitchSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return mutation object with expected properties', () => {
    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('error');
  });

  it('should generate summary successfully', async () => {
    const mockResponse = {
      success: true,
      summary: 'Philippine snack market offers 15% growth opportunity.',
      generated_at: '2025-01-15T10:00:00Z',
      metadata: {
        model: 'claude-sonnet-4-20250514',
        sections_analyzed: 3,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ pitchDraftId: 'draft-123' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(toast.success).toHaveBeenCalledWith(
      'Summary generated',
      expect.objectContaining({
        description: expect.stringContaining('3 sections'),
      })
    );
  });

  it('should handle validation errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: 'Missing required field: pitch_draft_id',
          code: 'VALIDATION_ERROR',
        }),
    });

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ pitchDraftId: '' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('pitch_draft_id');
    expect(toast.error).toHaveBeenCalledWith(
      'Failed to generate summary',
      expect.objectContaining({
        description: expect.stringContaining('pitch_draft_id'),
      })
    );
  });

  it('should handle empty pitch error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: 'Pitch has no content sections',
          code: 'EMPTY_PITCH',
        }),
    });

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ pitchDraftId: 'draft-123' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain(
      'Add content to your pitch before generating a summary'
    );
    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle timeout error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: 'Summary generation timed out',
          code: 'TIMEOUT',
        }),
    });

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ pitchDraftId: 'draft-123' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('took too long');
  });

  it('should handle rate limit error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: 'Service busy',
          code: 'RATE_LIMIT',
        }),
    });

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ pitchDraftId: 'draft-123' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('wait a moment');
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ pitchDraftId: 'draft-123' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(toast.error).toHaveBeenCalled();
  });

  it('should track pending state during generation', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useGeneratePitchSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate({ pitchDraftId: 'draft-123' });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    resolvePromise!({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          summary: 'Test summary',
          generated_at: new Date().toISOString(),
          metadata: { model: 'test', sections_analyzed: 1 },
        }),
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
