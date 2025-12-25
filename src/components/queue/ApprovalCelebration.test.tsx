import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApprovalCelebration } from './ApprovalCelebration';

// Mock Framer Motion - filter out framer-specific props to avoid console warnings
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initial, animate, exit, transition,
      ...htmlProps
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...htmlProps}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('ApprovalCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders approval animation container', () => {
    render(<ApprovalCelebration />);

    expect(screen.getByTestId('approval-animation')).toBeInTheDocument();
  });

  it('renders celebration effect', () => {
    render(<ApprovalCelebration />);

    expect(screen.getByTestId('approval-celebration')).toBeInTheDocument();
  });

  it('renders checkmark icon', () => {
    render(<ApprovalCelebration />);

    // Lucide icons use SVG with specific class
    const celebration = screen.getByTestId('approval-celebration');
    expect(celebration.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onComplete after animation duration', async () => {
    const onComplete = vi.fn();
    render(<ApprovalCelebration onComplete={onComplete} />);

    // Animation duration is 0.6s = 600ms
    expect(onComplete).not.toHaveBeenCalled();

    // Fast-forward past animation duration
    vi.advanceTimersByTime(600);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(<ApprovalCelebration onComplete={onComplete} />);

    // Unmount before animation completes
    unmount();

    // Advance time
    vi.advanceTimersByTime(1000);

    // onComplete should not be called
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not throw when onComplete is not provided', () => {
    expect(() => {
      render(<ApprovalCelebration />);
      vi.advanceTimersByTime(600);
    }).not.toThrow();
  });
});
