/**
 * Unit Tests for useKelPosition Hook
 *
 * Tests create/update logic and basic mutation behavior.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { competitorsRepo } from '@/lib/repositories/competitors';

import { useCompetitorData } from './useCompetitorData';
import { useSetKelPosition } from './useKelPosition';

import type { CompetitorDataPoint } from '@/types';

// Mock dependencies
vi.mock('@/lib/repositories/competitors');
vi.mock('@/hooks/competitors/useCompetitorData');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSetKelPosition', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
  });

  it('calls create when competitors array is empty', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'kel-new',
      name: "Kel's Target Position",
      price_score: 7,
      quality_score: 8,
      category: null,
      notes: null,
      is_kel_position: true,
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    });

    vi.mocked(competitorsRepo.create).mockImplementation(mockCreate);
    // Mock useCompetitorData to return empty array
    vi.mocked(useCompetitorData).mockReturnValue({ data: [] } as any);

    // Set initial competitors data (no Kel position)
    queryClient.setQueryData<CompetitorDataPoint[]>(queryKeys.competitors.all, []);

    const { result } = renderHook(() => useSetKelPosition(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ price_score: 7, quality_score: 8, notes: null });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: "Kel's Target Position",
        price_score: 7,
        quality_score: 8,
        notes: null,
        category: null,
        is_kel_position: true,
      });
    });
  });

  it('mutation is created and can be triggered', () => {
    vi.mocked(useCompetitorData).mockReturnValue({ data: [] } as any);
    queryClient.setQueryData<CompetitorDataPoint[]>(queryKeys.competitors.all, []);

    const { result } = renderHook(() => useSetKelPosition(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('calls update when Kel position already exists', async () => {
    const existingKel: CompetitorDataPoint = {
      id: 'kel-existing',
      name: 'Custom Kel Name',
      price_score: 5,
      quality_score: 5,
      category: null,
      notes: null,
      is_kel_position: true,
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockResolvedValue({
      ...existingKel,
      price_score: 7,
      quality_score: 8,
      notes: 'Updated',
    });

    vi.mocked(competitorsRepo.update).mockImplementation(mockUpdate);
    // Mock useCompetitorData to return array with existing Kel position
    vi.mocked(useCompetitorData).mockReturnValue({ data: [existingKel] } as any);

    queryClient = new QueryClient();
    // Set initial competitors data with existing Kel position
    queryClient.setQueryData<CompetitorDataPoint[]>(queryKeys.competitors.all, [existingKel]);

    const { result } = renderHook(() => useSetKelPosition(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ price_score: 7, quality_score: 8, notes: 'Updated' });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });

    // Verify update was called with correct parameters
    expect(mockUpdate).toHaveBeenCalledWith('kel-existing', {
      price_score: 7,
      quality_score: 8,
      notes: 'Updated',
      // Name and category NOT included - preserving existing values
    });
  });

  it('preserves existing name when updating Kel position', async () => {
    const existingKel: CompetitorDataPoint = {
      id: 'kel-custom',
      name: 'My Custom Kel Name', // User set this via CompetitorForm
      price_score: 6,
      quality_score: 6,
      category: 'Premium',
      notes: 'Original notes',
      is_kel_position: true,
      created_by: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockResolvedValue({
      ...existingKel,
      price_score: 8,
      quality_score: 9,
    });

    vi.mocked(competitorsRepo.update).mockImplementation(mockUpdate);
    // Mock useCompetitorData to return array with existing Kel position
    vi.mocked(useCompetitorData).mockReturnValue({ data: [existingKel] } as any);

    queryClient = new QueryClient();
    queryClient.setQueryData<CompetitorDataPoint[]>(queryKeys.competitors.all, [existingKel]);

    const { result } = renderHook(() => useSetKelPosition(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ price_score: 8, quality_score: 9, notes: null });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });

    // Verify name and category are preserved by NOT being in update payload
    const updateCall = mockUpdate.mock.calls[0];
    expect(updateCall).toBeDefined();
    expect(updateCall[1]).not.toHaveProperty('name');
    expect(updateCall[1]).not.toHaveProperty('category');
  });
});
