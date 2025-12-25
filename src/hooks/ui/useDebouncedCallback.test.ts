'use client';

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls callback after delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 2000));

    // Call the debounced function
    act(() => {
      result.current.debouncedFn();
    });

    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();

    // Advance time by delay
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Now callback should be called
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('resets timer on repeated calls (debounce behavior)', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 2000));

    // Call multiple times rapidly
    act(() => {
      result.current.debouncedFn();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Call again before delay completes
    act(() => {
      result.current.debouncedFn();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Callback should still not be called (timer was reset)
    expect(callback).not.toHaveBeenCalled();

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now callback should be called once
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancel() prevents pending callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 2000));

    // Call the debounced function
    act(() => {
      result.current.debouncedFn();
    });

    // Cancel before delay completes
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.cancel();
    });

    // Advance past the original delay
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Callback should never be called
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up on unmount (no memory leaks)', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 2000)
    );

    // Call the debounced function
    act(() => {
      result.current.debouncedFn();
    });

    // Unmount before delay completes
    unmount();

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });

  it('passes arguments to callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, 2000)
    );

    // Call with arguments
    act(() => {
      result.current.debouncedFn('arg1', 'arg2');
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('uses default delay of 2000ms when not specified', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback));

    act(() => {
      result.current.debouncedFn();
    });

    // Should not be called at 1999ms
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(callback).not.toHaveBeenCalled();

    // Should be called at 2000ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
