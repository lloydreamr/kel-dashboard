import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSyncIndicator } from './useSyncIndicator';

describe('useSyncIndicator', () => {
  describe('initial state', () => {
    it('returns idle status when all mutation states are false', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: false, isSuccess: false, isError: false })
      );

      expect(result.current.status).toBe('idle');
    });

    it('returns trigger of 0 initially', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: false, isSuccess: false, isError: false })
      );

      expect(result.current.trigger).toBe(0);
    });
  });

  describe('saving state', () => {
    it('returns saving status when isPending is true', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: true, isSuccess: false, isError: false })
      );

      expect(result.current.status).toBe('saving');
    });

    it('increments trigger when isPending becomes true', async () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: false, isSuccess: false, isError: false } }
      );

      expect(result.current.trigger).toBe(0);

      rerender({ isPending: true, isSuccess: false, isError: false });

      // Trigger update is async via queueMicrotask
      await waitFor(() => {
        expect(result.current.trigger).toBe(1);
      });
    });
  });

  describe('success state', () => {
    it('returns success status when isSuccess is true', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: false, isSuccess: true, isError: false })
      );

      expect(result.current.status).toBe('success');
    });

    it('increments trigger when transitioning to success', async () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: true, isSuccess: false, isError: false } }
      );

      // Wait for initial pending trigger
      await waitFor(() => {
        expect(result.current.trigger).toBe(1);
      });

      rerender({ isPending: false, isSuccess: true, isError: false });

      // Wait for success trigger
      await waitFor(() => {
        expect(result.current.trigger).toBe(2);
      });
    });
  });

  describe('error state', () => {
    it('returns error status when isError is true', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: false, isSuccess: false, isError: true })
      );

      expect(result.current.status).toBe('error');
    });

    it('increments trigger when transitioning to error', async () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: true, isSuccess: false, isError: false } }
      );

      // Wait for initial pending trigger
      await waitFor(() => {
        expect(result.current.trigger).toBe(1);
      });

      rerender({ isPending: false, isSuccess: false, isError: true });

      // Wait for error trigger
      await waitFor(() => {
        expect(result.current.trigger).toBe(2);
      });
    });
  });

  describe('state transitions', () => {
    it('transitions from idle -> saving -> success', async () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: false, isSuccess: false, isError: false } }
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.trigger).toBe(0);

      // Start saving
      rerender({ isPending: true, isSuccess: false, isError: false });
      expect(result.current.status).toBe('saving');
      await waitFor(() => {
        expect(result.current.trigger).toBe(1);
      });

      // Complete successfully
      rerender({ isPending: false, isSuccess: true, isError: false });
      expect(result.current.status).toBe('success');
      await waitFor(() => {
        expect(result.current.trigger).toBe(2);
      });
    });

    it('transitions from idle -> saving -> error', async () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: false, isSuccess: false, isError: false } }
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.trigger).toBe(0);

      // Start saving
      rerender({ isPending: true, isSuccess: false, isError: false });
      expect(result.current.status).toBe('saving');
      await waitFor(() => {
        expect(result.current.trigger).toBe(1);
      });

      // Fail
      rerender({ isPending: false, isSuccess: false, isError: true });
      expect(result.current.status).toBe('error');
      await waitFor(() => {
        expect(result.current.trigger).toBe(2);
      });
    });

    it('returns to idle after success resets', () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: false, isSuccess: true, isError: false } }
      );

      expect(result.current.status).toBe('success');

      // After mutation resets (new query)
      rerender({ isPending: false, isSuccess: false, isError: false });

      expect(result.current.status).toBe('idle');
    });
  });

  describe('multiple operations', () => {
    it('increments trigger for each new operation', async () => {
      const { result, rerender } = renderHook(
        (props) => useSyncIndicator(props),
        { initialProps: { isPending: false, isSuccess: false, isError: false } }
      );

      // First operation
      rerender({ isPending: true, isSuccess: false, isError: false });
      await waitFor(() => {
        expect(result.current.trigger).toBe(1);
      });

      rerender({ isPending: false, isSuccess: true, isError: false });
      await waitFor(() => {
        expect(result.current.trigger).toBe(2);
      });

      // Reset
      rerender({ isPending: false, isSuccess: false, isError: false });

      // Second operation
      rerender({ isPending: true, isSuccess: false, isError: false });
      await waitFor(() => {
        expect(result.current.trigger).toBe(3);
      });

      rerender({ isPending: false, isSuccess: true, isError: false });
      await waitFor(() => {
        expect(result.current.trigger).toBe(4);
      });
    });
  });

  describe('priority handling', () => {
    it('prioritizes isPending over isSuccess', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: true, isSuccess: true, isError: false })
      );

      expect(result.current.status).toBe('saving');
    });

    it('prioritizes isPending over isError', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: true, isSuccess: false, isError: true })
      );

      expect(result.current.status).toBe('saving');
    });

    it('prioritizes isError over isSuccess', () => {
      const { result } = renderHook(() =>
        useSyncIndicator({ isPending: false, isSuccess: true, isError: true })
      );

      expect(result.current.status).toBe('error');
    });
  });
});
