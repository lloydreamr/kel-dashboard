import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { SwipeableSheetContent, SWIPE_THRESHOLD, SWIPE_VELOCITY_THRESHOLD } from './SwipeableSheetContent';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onDragEnd,
      'data-testid': testId,
      ...props
    }: {
      children: React.ReactNode;
      onDragEnd?: (event: unknown, info: { offset: { y: number }; velocity: { y: number } }) => void;
      'data-testid'?: string;
    }) => (
      <div
        data-testid={testId}
        data-ondragend={onDragEnd ? 'true' : 'false'}
        {...props}
        // Expose onDragEnd for test simulation via custom event
        onMouseUp={(e) => {
          // Allow tests to simulate drag end via data attributes
          const target = e.currentTarget as HTMLElement;
          const offsetY = parseInt(target.dataset.simulateOffsetY ?? '0', 10);
          const velocityY = parseInt(target.dataset.simulateVelocityY ?? '0', 10);
          if (onDragEnd && (offsetY || velocityY)) {
            onDragEnd(e as unknown as MouseEvent, {
              offset: { y: offsetY },
              velocity: { y: velocityY },
            });
          }
        }}
      >
        {children}
      </div>
    ),
  },
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => 1,
  useAnimation: () => ({
    // Return a promise that resolves immediately for tests
    start: vi.fn(() => Promise.resolve()),
  }),
}));

describe('SwipeableSheetContent', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <SwipeableSheetContent onDismiss={mockOnDismiss}>
        <p>Test content</p>
      </SwipeableSheetContent>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders swipe handle with correct testid', () => {
    render(
      <SwipeableSheetContent onDismiss={mockOnDismiss}>
        <p>Content</p>
      </SwipeableSheetContent>
    );

    expect(screen.getByTestId('viz-modal-swipe-handle')).toBeInTheDocument();
  });

  it('renders swipeable container with correct testid', () => {
    render(
      <SwipeableSheetContent onDismiss={mockOnDismiss}>
        <p>Content</p>
      </SwipeableSheetContent>
    );

    expect(screen.getByTestId('swipeable-content')).toBeInTheDocument();
  });

  it('has drag handle with aria-hidden for accessibility', () => {
    render(
      <SwipeableSheetContent onDismiss={mockOnDismiss}>
        <p>Content</p>
      </SwipeableSheetContent>
    );

    const handle = screen.getByTestId('viz-modal-swipe-handle');
    expect(handle).toHaveAttribute('aria-hidden', 'true');
  });

  it('has drag handle styled correctly', () => {
    render(
      <SwipeableSheetContent onDismiss={mockOnDismiss}>
        <p>Content</p>
      </SwipeableSheetContent>
    );

    const handle = screen.getByTestId('viz-modal-swipe-handle');
    expect(handle).toHaveClass('mx-auto', 'mt-2', 'mb-4', 'h-1', 'w-12', 'rounded-full');
  });

  it('exports SWIPE_THRESHOLD constant', () => {
    expect(SWIPE_THRESHOLD).toBe(50);
  });

  it('exports SWIPE_VELOCITY_THRESHOLD constant', () => {
    expect(SWIPE_VELOCITY_THRESHOLD).toBe(500);
  });

  describe('drag gesture behavior', () => {
    it('calls onDismiss when swiped past threshold distance', async () => {
      render(
        <SwipeableSheetContent onDismiss={mockOnDismiss}>
          <p>Content</p>
        </SwipeableSheetContent>
      );

      const container = screen.getByTestId('swipeable-content');

      // Simulate drag past threshold
      container.dataset.simulateOffsetY = String(SWIPE_THRESHOLD + 10);
      container.dataset.simulateVelocityY = '0';
      fireEvent.mouseUp(container);

      // onDismiss is called after the animation promise resolves
      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalled();
      });
    });

    it('calls onDismiss when velocity exceeds threshold', async () => {
      render(
        <SwipeableSheetContent onDismiss={mockOnDismiss}>
          <p>Content</p>
        </SwipeableSheetContent>
      );

      const container = screen.getByTestId('swipeable-content');

      // Simulate fast swipe even if distance is small
      container.dataset.simulateOffsetY = '10';
      container.dataset.simulateVelocityY = String(SWIPE_VELOCITY_THRESHOLD + 100);
      fireEvent.mouseUp(container);

      // onDismiss is called after the animation promise resolves
      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalled();
      });
    });

    it('does not dismiss on small incomplete swipe', () => {
      render(
        <SwipeableSheetContent onDismiss={mockOnDismiss}>
          <p>Content</p>
        </SwipeableSheetContent>
      );

      const container = screen.getByTestId('swipeable-content');

      // Simulate incomplete swipe (below threshold)
      container.dataset.simulateOffsetY = String(SWIPE_THRESHOLD - 10);
      container.dataset.simulateVelocityY = '100';
      fireEvent.mouseUp(container);

      // onDismiss should NOT be called for incomplete swipe
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });
});
