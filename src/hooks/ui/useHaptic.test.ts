import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useHaptic } from './useHaptic';

describe('useHaptic', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('when Vibration API is supported', () => {
    const mockVibrate = vi.fn().mockReturnValue(true);

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
      });
    });

    it('returns isSupported as true', () => {
      const { result } = renderHook(() => useHaptic());

      expect(result.current.isSupported).toBe(true);
    });

    it('triggers light haptic with 20ms vibration', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('light');
      });

      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it('triggers medium haptic with 40ms vibration', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('medium');
      });

      expect(mockVibrate).toHaveBeenCalledWith(40);
    });

    it('triggers heavy haptic with 80ms vibration', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('heavy');
      });

      expect(mockVibrate).toHaveBeenCalledWith(80);
    });

    it('triggers success haptic with double pulse pattern', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('success');
      });

      expect(mockVibrate).toHaveBeenCalledWith([20, 50, 20]);
    });

    it('triggers warning haptic with longer double pulse', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('warning');
      });

      expect(mockVibrate).toHaveBeenCalledWith([40, 30, 40]);
    });

    it('handles vibration errors gracefully', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration not allowed');
      });

      const { result } = renderHook(() => useHaptic());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.trigger('light');
        });
      }).not.toThrow();
    });
  });

  describe('when Vibration API is not supported', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });
    });

    it('returns isSupported as false', () => {
      const { result } = renderHook(() => useHaptic());

      expect(result.current.isSupported).toBe(false);
    });

    it('trigger is a no-op', () => {
      const { result } = renderHook(() => useHaptic());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.trigger('light');
        });
      }).not.toThrow();
    });
  });

  describe('when navigator is undefined (SSR)', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });
    });

    it('returns isSupported as false', () => {
      const { result } = renderHook(() => useHaptic());

      expect(result.current.isSupported).toBe(false);
    });

    it('trigger is a no-op', () => {
      const { result } = renderHook(() => useHaptic());

      expect(() => {
        act(() => {
          result.current.trigger('light');
        });
      }).not.toThrow();
    });
  });
});
