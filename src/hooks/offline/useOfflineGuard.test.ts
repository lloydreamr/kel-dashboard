/**
 * @fileoverview Tests for useOfflineGuard hook
 *
 * Tests the offline write blocking behavior.
 * Story 10.3: Offline Read-Only Mode (Task 5)
 */

import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  useOfflineGuard,
  OFFLINE_TOAST_ID,
  OFFLINE_MESSAGE,
  OfflineError,
  isOfflineError,
} from './useOfflineGuard';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock FEATURES
const mockOfflineRead = vi.fn();
vi.mock('@/lib/features', () => ({
  FEATURES: {
    get OFFLINE_READ() {
      return mockOfflineRead();
    },
  },
}));

describe('useOfflineGuard', () => {
  const originalNavigatorOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: online and feature enabled
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    mockOfflineRead.mockReturnValue(true);
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      configurable: true,
    });
  });

  describe('online behavior', () => {
    it('does not throw when online (allows operation)', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOfflineGuard());

      expect(() => {
        act(() => {
          result.current.guardOffline();
        });
      }).not.toThrow();
    });

    it('does not show toast when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOfflineGuard());

      act(() => {
        result.current.guardOffline();
      });

      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('offline behavior with feature enabled (AC#3)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });
      mockOfflineRead.mockReturnValue(true);
    });

    it('throws OfflineError when offline (blocks operation)', () => {
      const { result } = renderHook(() => useOfflineGuard());

      expect(() => {
        act(() => {
          result.current.guardOffline();
        });
      }).toThrow(OfflineError);
    });

    it('shows error toast with correct message before throwing', () => {
      const { result } = renderHook(() => useOfflineGuard());

      try {
        act(() => {
          result.current.guardOffline();
        });
      } catch {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith(
        OFFLINE_MESSAGE,
        expect.objectContaining({
          id: OFFLINE_TOAST_ID,
        })
      );
    });

    it('uses id for deduplication (prevents toast spam)', () => {
      const { result } = renderHook(() => useOfflineGuard());

      // Simulate multiple rapid clicks
      for (let i = 0; i < 3; i++) {
        try {
          act(() => {
            result.current.guardOffline();
          });
        } catch {
          // Expected
        }
      }

      // All calls should use the same ID, letting Sonner deduplicate
      const calls = vi.mocked(toast.error).mock.calls;
      expect(calls.length).toBe(3);
      calls.forEach((call) => {
        expect(call[1]).toHaveProperty('id', OFFLINE_TOAST_ID);
      });
    });
  });

  describe('feature flag disabled (AC#6)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });
      mockOfflineRead.mockReturnValue(false);
    });

    it('does not throw when offline but feature disabled', () => {
      const { result } = renderHook(() => useOfflineGuard());

      expect(() => {
        act(() => {
          result.current.guardOffline();
        });
      }).not.toThrow();
    });

    it('does not show toast when feature disabled', () => {
      const { result } = renderHook(() => useOfflineGuard());

      act(() => {
        result.current.guardOffline();
      });

      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('SSR safety', () => {
    it('does not throw when navigator is undefined (SSR)', () => {
      // Temporarily make navigator.onLine return undefined behavior
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing SSR where navigator may not exist
      delete global.navigator;

      const { result } = renderHook(() => useOfflineGuard());

      expect(() => {
        act(() => {
          result.current.guardOffline();
        });
      }).not.toThrow();

      // Restore
      global.navigator = originalNavigator;
    });
  });

  describe('OfflineError class', () => {
    it('has correct message', () => {
      const error = new OfflineError();
      expect(error.message).toBe(OFFLINE_MESSAGE);
    });

    it('has correct name', () => {
      const error = new OfflineError();
      expect(error.name).toBe('OfflineError');
    });

    it('has isOfflineError property', () => {
      const error = new OfflineError();
      expect(error.isOfflineError).toBe(true);
    });

    it('is instance of Error', () => {
      const error = new OfflineError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('isOfflineError type guard', () => {
    it('returns true for OfflineError instances', () => {
      const error = new OfflineError();
      expect(isOfflineError(error)).toBe(true);
    });

    it('returns true for objects with isOfflineError property', () => {
      const error = { isOfflineError: true, message: 'test' };
      expect(isOfflineError(error)).toBe(true);
    });

    it('returns false for regular errors', () => {
      const error = new Error('test');
      expect(isOfflineError(error)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isOfflineError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isOfflineError(undefined)).toBe(false);
    });

    it('returns false for strings', () => {
      expect(isOfflineError('error')).toBe(false);
    });
  });

  describe('exported constants', () => {
    it('exports OFFLINE_TOAST_ID for E2E test identification', () => {
      expect(OFFLINE_TOAST_ID).toBe('offline-write-blocked');
    });

    it('exports OFFLINE_MESSAGE for consistency', () => {
      expect(OFFLINE_MESSAGE).toBe('Unavailable offline - changes will sync when online');
    });
  });
});
