'use client';

/**
 * useSyncStatus Hook
 *
 * Tracks data sync freshness and provides state for sync indicators.
 * Persists last sync time to localStorage for cross-session tracking.
 *
 * Story 10.4: Offline Detection & Sync Indicator (Task 1)
 *
 * States:
 * - fresh: Data synced within the last minute (green indicator)
 * - stale: Data synced more than 1 minute ago (yellow indicator)
 * - offline: Network is offline (gray indicator)
 *
 * @example
 * ```tsx
 * const { syncState, timeSinceSync, updateSyncTime } = useSyncStatus();
 *
 * // Display sync state
 * <span>{syncState === 'fresh' ? 'Up to date' : timeSinceSync}</span>
 *
 * // After successful data fetch
 * updateSyncTime();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

import { useOnlineStatus } from './useOnlineStatus';
import { getSyncTimestamp, setSyncTimestamp } from '@/lib/storage/syncStorage';
import { FEATURES } from '@/lib/features';

/** Sync state types */
export type SyncState = 'fresh' | 'stale' | 'offline';

/** Return type for useSyncStatus hook */
export interface SyncStatusResult {
  /** Last successful sync timestamp, or null if never synced */
  lastSync: Date | null;
  /** Current sync state based on time and connectivity */
  syncState: SyncState;
  /** Human-readable time since last sync (e.g., "2 min ago") */
  timeSinceSync: string;
  /** Update the last sync timestamp (call after successful data fetch) */
  updateSyncTime: () => void;
}

/** Freshness threshold: 1 minute in milliseconds */
const STALE_THRESHOLD_MS = 60 * 1000;

/** Update interval: 30 seconds */
const UPDATE_INTERVAL_MS = 30 * 1000;

/**
 * Calculate human-readable time since last sync.
 */
function formatTimeSinceSync(lastSync: Date | null): string {
  if (!lastSync) {
    return 'Loading...';
  }

  const ms = Date.now() - lastSync.getTime();

  if (ms < 60000) {
    return 'just now';
  } else if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min ago`;
  } else {
    const hours = Math.floor(ms / 3600000);
    return `${hours} hr ago`;
  }
}

/**
 * Calculate sync state based on time and network status.
 */
function calculateSyncState(
  isOnline: boolean,
  lastSync: Date | null
): SyncState {
  if (!isOnline) {
    return 'offline';
  }

  if (!lastSync) {
    return 'stale';
  }

  const timeSinceMs = Date.now() - lastSync.getTime();
  return timeSinceMs > STALE_THRESHOLD_MS ? 'stale' : 'fresh';
}

/**
 * Hook for tracking data sync status and freshness.
 *
 * Provides sync state (fresh/stale/offline), human-readable time display,
 * and a function to update the sync timestamp after successful fetches.
 *
 * When FEATURES.OFFLINE_READ is false, returns a dummy state that
 * always shows 'fresh' to avoid unnecessary UI.
 */
export function useSyncStatus(): SyncStatusResult {
  const { isOnline } = useOnlineStatus();
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [timeSinceSync, setTimeSinceSync] = useState('Loading...');
  const [initialized, setInitialized] = useState(false);

  // Initialize from localStorage (only if feature flag enabled)
  useEffect(() => {
    if (!FEATURES.OFFLINE_READ) {
      setInitialized(true);
      return;
    }

    const stored = getSyncTimestamp();
    if (stored) {
      setLastSync(stored);
    }
    setInitialized(true);
  }, []);

  // Update time display every 30 seconds
  useEffect(() => {
    if (!FEATURES.OFFLINE_READ) {
      setTimeSinceSync('just now');
      return;
    }

    const updateTime = () => {
      if (!initialized) {
        setTimeSinceSync('Loading...');
        return;
      }
      setTimeSinceSync(formatTimeSinceSync(lastSync));
    };

    updateTime();
    const interval = setInterval(updateTime, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lastSync, initialized]);

  // Calculate current sync state
  const syncState: SyncState = !FEATURES.OFFLINE_READ
    ? 'fresh'
    : calculateSyncState(isOnline, lastSync);

  // Function to update sync time after successful fetch
  const updateSyncTime = useCallback(() => {
    if (!FEATURES.OFFLINE_READ) return;

    const now = new Date();
    setLastSync(now);
    setSyncTimestamp(now);
  }, []);

  return {
    lastSync,
    syncState,
    timeSinceSync,
    updateSyncTime,
  };
}
