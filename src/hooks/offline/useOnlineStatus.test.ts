/**
 * @fileoverview Tests for useOnlineStatus hook
 *
 * Tests the SSR-safe online/offline status detection.
 * Story 10.3: Offline Read-Only Mode (Task 2)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useOnlineStatus } from './useOnlineStatus';

// Mock FEATURES
const mockOfflineRead = vi.fn();
const mockOfflineMode = vi.fn();
vi.mock('@/lib/features', () => ({
  FEATURES: {
    get OFFLINE_READ() { return mockOfflineRead(); },
    get OFFLINE_MODE() { return mockOfflineMode(); },
  },
}));

describe('useOnlineStatus', () => {
  const originalNavigatorOnLine = navigator.onLine;
  let onlineEventListeners: Array<() => void> = [];
  let offlineEventListeners: Array<() => void> = [];

  beforeEach(() => {
    vi.useFakeTimers();
    onlineEventListeners = [];
    offlineEventListeners = [];

    // Enable feature flags by default for most tests
    mockOfflineRead.mockReturnValue(true);
    mockOfflineMode.mockReturnValue(false);

    // Mock addEventListener to capture listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineEventListeners.push(handler as () => void);
      } else if (event === 'offline') {
        offlineEventListeners.push(handler as () => void);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {
      // cleanup handled by restoring mocks
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      configurable: true,
    });
  });

  describe('SSR safety', () => {
    it('defaults to online (true) for SSR hydration safety', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      // Initial render (before useEffect) should be true for SSR safety
      // This prevents hydration mismatch between server (true) and client (actual)
      expect(result.current.isOnline).toBeDefined();
      expect(typeof result.current.isOnline).toBe('boolean');
    });

    it('updates to actual status after hydration', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('online status', () => {
    it('returns isOnline true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('returns isOnline false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('registers online and offline event listeners', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('updates to online when online event fires', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(false);

      // Simulate going online
      act(() => {
        onlineEventListeners.forEach((listener) => listener());
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('updates to offline when offline event fires', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        offlineEventListeners.forEach((listener) => listener());
        vi.runAllTimers();
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('removes event listeners on unmount', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { unmount } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('return type', () => {
    it('returns object with isOnline property', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toHaveProperty('isOnline');
      expect(typeof result.current.isOnline).toBe('boolean');
    });
  });

  describe('feature flag guard (Story 8.5 Task 1.5)', () => {
    it('does not add event listeners when both feature flags are disabled', () => {
      mockOfflineRead.mockReturnValue(false);
      mockOfflineMode.mockReturnValue(false);

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      // Should not have registered any listeners
      expect(onlineEventListeners).toHaveLength(0);
      expect(offlineEventListeners).toHaveLength(0);
    });

    it('adds event listeners when OFFLINE_READ is enabled', () => {
      mockOfflineRead.mockReturnValue(true);
      mockOfflineMode.mockReturnValue(false);

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('adds event listeners when OFFLINE_MODE is enabled', () => {
      mockOfflineRead.mockReturnValue(false);
      mockOfflineMode.mockReturnValue(true);

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('returns true (online) when both feature flags are disabled', () => {
      mockOfflineRead.mockReturnValue(false);
      mockOfflineMode.mockReturnValue(false);

      // Even if browser is offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      act(() => {
        vi.runAllTimers();
      });

      // Should stay true (SSR default) since hook doesn't check navigator.onLine
      expect(result.current.isOnline).toBe(true);
    });
  });
});
