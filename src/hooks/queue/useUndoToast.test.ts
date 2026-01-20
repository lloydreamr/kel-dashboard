/**
 * useUndoToast Hook Tests
 *
 * Unit tests for the hook that shows custom undo toast with progress bar.
 */

import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useUndoDecision } from '@/hooks/decisions';

import { useUndoToast } from './useUndoToast';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  },
}));

// Mock useUndoDecision hook
vi.mock('@/hooks/decisions', () => ({
  useUndoDecision: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('useUndoToast', () => {
  const mockUndoDecision = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUndoDecision as Mock).mockReturnValue({
      mutate: mockUndoDecision,
      isPending: false,
    });
  });

  // Test 1: Returns showUndoToast function
  it('returns showUndoToast function', () => {
    const { result } = renderHook(() => useUndoToast());

    expect(result.current.showUndoToast).toBeDefined();
    expect(typeof result.current.showUndoToast).toBe('function');
  });

  // Test 2: Returns isUndoing from useUndoDecision
  it('returns isUndoing from useUndoDecision', () => {
    (useUndoDecision as Mock).mockReturnValue({
      mutate: mockUndoDecision,
      isPending: true,
    });

    const { result } = renderHook(() => useUndoToast());

    expect(result.current.isUndoing).toBe(true);
  });

  // Test 3: Calls toast.custom with UndoToast component
  it('calls toast.custom when showUndoToast is called', () => {
    const { result } = renderHook(() => useUndoToast());

    act(() => {
      result.current.showUndoToast({
        message: 'Approved!',
        decisionId: 'decision-123',
        questionId: 'question-456',
      });
    });

    expect(toast.custom).toHaveBeenCalledTimes(1);
    // Check that it was called with a function (the component renderer)
    expect(typeof (toast.custom as Mock).mock.calls[0][0]).toBe('function');
  });

  // Test 4: Passes message to UndoToast
  it('passes message to UndoToast component', () => {
    const { result } = renderHook(() => useUndoToast());

    act(() => {
      result.current.showUndoToast({
        message: 'Test message',
        decisionId: 'decision-123',
        questionId: 'question-456',
      });
    });

    // Get the render function passed to toast.custom
    const renderFn = (toast.custom as Mock).mock.calls[0][0];
    // Call it with a mock toast ID to get the component props
    const element = renderFn('test-toast-id');

    expect(element.props.message).toBe('Test message');
  });

  // Test 5: Passes onUndo callback that calls undoDecision
  it('onUndo callback calls undoDecision with correct params', () => {
    const { result } = renderHook(() => useUndoToast());

    act(() => {
      result.current.showUndoToast({
        message: 'Approved!',
        decisionId: 'decision-123',
        questionId: 'question-456',
      });
    });

    // Get the render function and call it to get component
    const renderFn = (toast.custom as Mock).mock.calls[0][0];
    const element = renderFn('test-toast-id');

    // Call the onUndo callback
    act(() => {
      element.props.onUndo();
    });

    expect(mockUndoDecision).toHaveBeenCalledWith({
      decisionId: 'decision-123',
      questionId: 'question-456',
    });
  });

  // Test 6: Sets duration to Infinity
  it('sets toast duration to Infinity', () => {
    const { result } = renderHook(() => useUndoToast());

    act(() => {
      result.current.showUndoToast({
        message: 'Approved!',
        decisionId: 'decision-123',
        questionId: 'question-456',
      });
    });

    // Check the options object passed to toast.custom
    const options = (toast.custom as Mock).mock.calls[0][1];
    expect(options.duration).toBe(Infinity);
  });

  // Test 7: Returns toast ID for programmatic dismissal
  it('returns toast ID from showUndoToast', () => {
    const { result } = renderHook(() => useUndoToast());

    let toastId: string | number | undefined;
    act(() => {
      toastId = result.current.showUndoToast({
        message: 'Approved!',
        decisionId: 'decision-123',
        questionId: 'question-456',
      });
    });

    expect(toastId).toBe('mock-toast-id');
  });

  // Test 8: onUndo calls toast.dismiss to close the toast
  it('onUndo dismisses the toast', () => {
    const { result } = renderHook(() => useUndoToast());

    act(() => {
      result.current.showUndoToast({
        message: 'Approved!',
        decisionId: 'decision-123',
        questionId: 'question-456',
      });
    });

    // Get the render function and call it
    const renderFn = (toast.custom as Mock).mock.calls[0][0];
    const element = renderFn('test-toast-id');

    // Call onUndo
    act(() => {
      element.props.onUndo();
    });

    expect(toast.dismiss).toHaveBeenCalledWith('test-toast-id');
  });
});
