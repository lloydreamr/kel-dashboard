/**
 * UndoToast Component Tests
 *
 * Unit tests for the undo toast with progress bar countdown.
 * Tests cover rendering, progress bar, auto-dismiss, and undo functionality.
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UndoToast, UNDO_WINDOW_MS } from './UndoToast';

describe('UndoToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test 1: Renders with correct test-id
  it('renders with correct data-testid', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();
  });

  // Test 2: Displays message prop
  it('displays the message prop', () => {
    render(
      <UndoToast
        message="Approved with constraints"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('Approved with constraints')).toBeInTheDocument();
  });

  // Test 3: Shows progress bar at 100% initially
  it('shows progress bar at 100% initially', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const progressBar = screen.getByTestId('undo-progress-bar');
    expect(progressBar).toBeInTheDocument();

    // The inner bar should have width: 100%
    const innerBar = progressBar.firstChild as HTMLElement;
    expect(innerBar).toHaveStyle({ width: '100%' });
  });

  // Test 4: Progress bar shrinks over time
  it('progress bar shrinks over time', async () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    // Advance by half the time (2500ms)
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    const progressBar = screen.getByTestId('undo-progress-bar');
    const innerBar = progressBar.firstChild as HTMLElement;

    // Should be around 50% (+/- tolerance for interval timing)
    const widthStyle = innerBar.style.width;
    const widthPercent = parseFloat(widthStyle);
    expect(widthPercent).toBeGreaterThan(40);
    expect(widthPercent).toBeLessThan(60);
  });

  // Test 5: Calls onDismiss after 5 seconds
  it('calls onDismiss after 5 seconds', async () => {
    const onDismiss = vi.fn();

    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();

    // Advance past the undo window
    await act(async () => {
      vi.advanceTimersByTime(UNDO_WINDOW_MS + 200);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // Test 6: Calls onUndo when button clicked (uses real timers)
  it('calls onUndo when Undo button is clicked', async () => {
    // Use real timers for this test to avoid issues with userEvent
    vi.useRealTimers();
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    const { unmount } = render(
      <UndoToast
        message="Approved!"
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    );

    await user.click(screen.getByTestId('undo-button'));

    expect(onUndo).toHaveBeenCalledTimes(1);

    // Unmount immediately to stop timers
    unmount();
  });

  // Test 7: Button has 48px min-height touch target
  it('Undo button has 48px minimum touch target', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const undoButton = screen.getByTestId('undo-button');
    expect(undoButton).toHaveClass('min-h-[48px]');
  });

  // Test 8: Uses success color tokens
  it('uses success color tokens', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const toast = screen.getByTestId('undo-toast');
    expect(toast).toHaveClass('bg-success');
    expect(toast).toHaveClass('text-success-foreground');
  });

  // Test 9: Progress bar has correct test-id
  it('progress bar has correct data-testid', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId('undo-progress-bar')).toBeInTheDocument();
  });

  // Test 10: Button has correct test-id
  it('Undo button has correct data-testid', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
  });

  // Test 11: Stops countdown when unmounted (cleanup)
  it('cleans up timer on unmount', async () => {
    const onDismiss = vi.fn();

    const { unmount } = render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    // Advance partway
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Unmount before timer completes
    unmount();

    // Advance past when timer would have fired
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // onDismiss should NOT be called since component unmounted
    expect(onDismiss).not.toHaveBeenCalled();
  });

  // Test 12: Undo button text is "Undo"
  it('displays "Undo" text on button', () => {
    render(
      <UndoToast
        message="Approved!"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId('undo-button')).toHaveTextContent('Undo');
  });

  // Test 13: Double-click protection - only calls onUndo once
  it('prevents double-click by disabling button after first click', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    const { unmount } = render(
      <UndoToast
        message="Approved!"
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    );

    const undoButton = screen.getByTestId('undo-button');

    // Click twice rapidly
    await user.click(undoButton);
    await user.click(undoButton);

    // Should only be called once due to disabled state
    expect(onUndo).toHaveBeenCalledTimes(1);

    // Button should show "Undoing..." text
    expect(undoButton).toHaveTextContent('Undoing...');

    // Button should be disabled
    expect(undoButton).toBeDisabled();

    unmount();
  });
});
