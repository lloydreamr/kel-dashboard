/**
 * DashboardSyncIndicator Component Tests
 *
 * Tests for the TanStack Query-integrated sync indicator.
 * Story 10.4: Offline Detection & Sync Indicator (Task 5)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as features from '@/lib/features';

import { DashboardSyncIndicator } from './DashboardSyncIndicator';

// Mock the offline hooks
const mockUpdateSyncTime = vi.fn();
const mockUseSyncStatus = vi.fn();
const mockRefresh = vi.fn();
const mockUseManualRefresh = vi.fn();

vi.mock('@/hooks/offline', async () => {
  const actual = await vi.importActual('@/hooks/offline');
  return {
    ...actual,
    useSyncStatus: () => mockUseSyncStatus(),
    useManualRefresh: (callback: () => Promise<void>) => {
      mockUseManualRefresh(callback);
      return {
        refresh: mockRefresh,
        isRefreshing: false,
      };
    },
  };
});

// Mock features
vi.mock('@/lib/features', () => ({
  FEATURES: {
    OFFLINE_READ: true,
    OFFLINE_MODE: false,
  },
}));

describe('DashboardSyncIndicator', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.mocked(features.FEATURES).OFFLINE_READ = true;
    mockUseSyncStatus.mockReturnValue({
      lastSync: new Date(),
      syncState: 'fresh',
      timeSinceSync: 'just now',
      updateSyncTime: mockUpdateSyncTime,
    });
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  describe('rendering', () => {
    it('renders sync indicator', () => {
      renderWithClient(<DashboardSyncIndicator />);

      expect(screen.getByTestId('sync-indicator')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      renderWithClient(<DashboardSyncIndicator className="custom-class" />);

      // The component renders, className is passed to SyncIndicator
      expect(screen.getByTestId('sync-indicator')).toBeInTheDocument();
    });
  });

  describe('refresh functionality', () => {
    it('calls refresh callback when refresh button is clicked', async () => {
      const user = userEvent.setup();
      mockRefresh.mockResolvedValue(undefined);

      renderWithClient(<DashboardSyncIndicator />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('provides a callback that invalidates all query caches', async () => {
      renderWithClient(<DashboardSyncIndicator />);

      // The useManualRefresh hook receives a callback
      expect(mockUseManualRefresh).toHaveBeenCalled();

      // Get the callback that was passed to useManualRefresh
      const refreshCallback = mockUseManualRefresh.mock.calls[0][0];

      // Spy on queryClient.invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Call the callback
      await refreshCallback();

      // Should have invalidated all major query caches
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledTimes(5);
      });

      // Verify the query keys
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['questions'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['evidence'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['decisions'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['milestones'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['competitors'] })
      );
    });
  });

  describe('feature flag', () => {
    it('does not render when OFFLINE_READ feature is disabled', () => {
      vi.mocked(features.FEATURES).OFFLINE_READ = false;

      renderWithClient(<DashboardSyncIndicator />);

      expect(screen.queryByTestId('sync-indicator')).not.toBeInTheDocument();
    });
  });
});
