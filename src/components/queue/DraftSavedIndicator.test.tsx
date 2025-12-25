import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftSavedIndicator } from './DraftSavedIndicator';

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    span: ({
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initial, animate, exit, transition,
      ...htmlProps
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...htmlProps}>{children}</span>
    ),
  },
}));

describe('DraftSavedIndicator', () => {
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    rafCallbacks = [];
    // Stub requestAnimationFrame to capture callbacks
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    rafCallbacks = [];
  });

  // Helper to flush all pending requestAnimationFrame callbacks
  const flushRAF = () => {
    act(() => {
      rafCallbacks.forEach(cb => cb(performance.now()));
      rafCallbacks = [];
    });
  };

  it('renders with test-id when triggered', () => {
    render(<DraftSavedIndicator trigger={1} />);
    flushRAF();

    expect(screen.getByTestId('draft-saved-indicator')).toBeInTheDocument();
  });

  it('shows checkmark icon and "Draft saved" text', () => {
    render(<DraftSavedIndicator trigger={1} />);
    flushRAF();

    expect(screen.getByText('Draft saved')).toBeInTheDocument();

    // Checkmark icon should be present (SVG with polyline)
    const indicator = screen.getByTestId('draft-saved-indicator');
    expect(indicator.querySelector('svg')).toBeInTheDocument();
  });

  it('starts auto-hide timer when trigger increments', () => {
    const { rerender } = render(<DraftSavedIndicator trigger={0} />);
    flushRAF();

    // Not visible initially (trigger=0)
    expect(screen.queryByTestId('draft-saved-indicator')).not.toBeInTheDocument();

    // Trigger the indicator
    rerender(<DraftSavedIndicator trigger={1} />);
    flushRAF();

    // Should be visible
    expect(screen.getByTestId('draft-saved-indicator')).toBeInTheDocument();
  });

  it('does not render when trigger is 0', () => {
    render(<DraftSavedIndicator trigger={0} />);
    flushRAF();

    expect(screen.queryByTestId('draft-saved-indicator')).not.toBeInTheDocument();
  });

  it('re-shows when trigger increments again', () => {
    const { rerender } = render(<DraftSavedIndicator trigger={0} />);
    flushRAF();

    // Should not be visible
    expect(screen.queryByTestId('draft-saved-indicator')).not.toBeInTheDocument();

    // First trigger
    rerender(<DraftSavedIndicator trigger={1} />);
    flushRAF();

    // Should now be visible
    expect(screen.getByTestId('draft-saved-indicator')).toBeInTheDocument();

    // Second trigger (increment again)
    rerender(<DraftSavedIndicator trigger={2} />);
    flushRAF();

    // Should still be visible (new show cycle)
    expect(screen.getByTestId('draft-saved-indicator')).toBeInTheDocument();
  });
});
