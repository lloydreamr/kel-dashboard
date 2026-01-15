/**
 * Tests for useCreatePitchWithTemplate Hook
 *
 * Story 18-4: Pitch Template Library
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock repositories
vi.mock('@/lib/repositories', () => ({
  pitchDraftsRepo: {
    create: vi.fn(),
  },
  pitchSectionsRepo: {
    createBatch: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { pitchDraftsRepo, pitchSectionsRepo } from '@/lib/repositories';

import { useCreatePitchWithTemplate } from './useCreatePitchWithTemplate';

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

describe('useCreatePitchWithTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns mutation object with expected properties', () => {
    const { result } = renderHook(() => useCreatePitchWithTemplate(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
  });

  describe('without template (custom pitch)', () => {
    it('creates draft without sections when template_type is null', async () => {
      const mockDraft = {
        id: 'd1',
        title: 'Custom Pitch',
        status: 'draft',
        template_type: null,
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      };

      vi.mocked(pitchDraftsRepo.create).mockResolvedValue(mockDraft as never);

      const { result } = renderHook(() => useCreatePitchWithTemplate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: 'Custom Pitch', template_type: null });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        draft: mockDraft,
        sections: [],
      });
      expect(pitchDraftsRepo.create).toHaveBeenCalledWith({
        title: 'Custom Pitch',
        template_type: null,
      });
      expect(pitchSectionsRepo.createBatch).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Created "Custom Pitch"');
    });
  });

  describe('with template', () => {
    it('creates draft and sections when template_type is mid_size', async () => {
      const mockDraft = {
        id: 'd1',
        title: 'EFC Pitch',
        status: 'draft',
        template_type: 'mid_size',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      };

      const mockSections = [
        {
          id: 's1',
          pitch_draft_id: 'd1',
          section_type: 'market_opportunity',
          content: 'Market opportunity placeholder',
          ai_generated: false,
          user_edited: false,
        },
        {
          id: 's2',
          pitch_draft_id: 'd1',
          section_type: 'competitive_positioning',
          content: 'Competitive positioning placeholder',
          ai_generated: false,
          user_edited: false,
        },
        {
          id: 's3',
          pitch_draft_id: 'd1',
          section_type: 'trend_alignment',
          content: 'Trend alignment placeholder',
          ai_generated: false,
          user_edited: false,
        },
      ];

      vi.mocked(pitchDraftsRepo.create).mockResolvedValue(mockDraft as never);
      vi.mocked(pitchSectionsRepo.createBatch).mockResolvedValue(
        mockSections as never
      );

      const { result } = renderHook(() => useCreatePitchWithTemplate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: 'EFC Pitch', template_type: 'mid_size' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        draft: mockDraft,
        sections: mockSections,
      });
      expect(pitchDraftsRepo.create).toHaveBeenCalledWith({
        title: 'EFC Pitch',
        template_type: 'mid_size',
      });
      expect(pitchSectionsRepo.createBatch).toHaveBeenCalledWith(
        'd1',
        expect.arrayContaining([
          expect.objectContaining({ section_type: 'market_opportunity' }),
          expect.objectContaining({ section_type: 'competitive_positioning' }),
          expect.objectContaining({ section_type: 'trend_alignment' }),
        ])
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Created "EFC Pitch" with 3 sections'
      );
    });

    it('creates sections with placeholder content from template', async () => {
      const mockDraft = {
        id: 'd1',
        title: 'WOFEX Pitch',
        status: 'draft',
        template_type: 'wofex_booth',
      };

      vi.mocked(pitchDraftsRepo.create).mockResolvedValue(mockDraft as never);
      vi.mocked(pitchSectionsRepo.createBatch).mockResolvedValue([] as never);

      const { result } = renderHook(() => useCreatePitchWithTemplate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        title: 'WOFEX Pitch',
        template_type: 'wofex_booth',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify createBatch was called with section data including placeholder content
      expect(pitchSectionsRepo.createBatch).toHaveBeenCalledWith(
        'd1',
        expect.arrayContaining([
          expect.objectContaining({
            section_type: 'market_opportunity',
            content: expect.stringContaining('Quick market snapshot'),
            ai_generated: false,
            user_edited: false,
          }),
        ])
      );
    });
  });

  describe('error handling', () => {
    it('shows error toast when draft creation fails', async () => {
      vi.mocked(pitchDraftsRepo.create).mockRejectedValue(
        new Error('Database error')
      );

      const { result } = renderHook(() => useCreatePitchWithTemplate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: 'Test', template_type: null });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Database error');
      expect(toast.error).toHaveBeenCalledWith('Failed to create pitch', {
        description: 'Database error',
      });
    });

    it('shows error toast when section creation fails', async () => {
      const mockDraft = {
        id: 'd1',
        title: 'Test',
        status: 'draft',
        template_type: 'mid_size',
      };

      vi.mocked(pitchDraftsRepo.create).mockResolvedValue(mockDraft as never);
      vi.mocked(pitchSectionsRepo.createBatch).mockRejectedValue(
        new Error('Section creation failed')
      );

      const { result } = renderHook(() => useCreatePitchWithTemplate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ title: 'Test', template_type: 'mid_size' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Section creation failed');
      expect(toast.error).toHaveBeenCalledWith('Failed to create pitch', {
        description: 'Section creation failed',
      });
    });
  });

  describe('pending state', () => {
    it('tracks pending state during creation', async () => {
      let resolveDraft: (value: unknown) => void;
      const draftPromise = new Promise((resolve) => {
        resolveDraft = resolve;
      });

      vi.mocked(pitchDraftsRepo.create).mockReturnValue(draftPromise as never);

      const { result } = renderHook(() => useCreatePitchWithTemplate(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate({ title: 'Test', template_type: null });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveDraft!({
        id: 'd1',
        title: 'Test',
        status: 'draft',
        template_type: null,
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
