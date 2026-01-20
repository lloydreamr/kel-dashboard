import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CompetitorDetailSheet } from './CompetitorDetailSheet';

import type { CompetitorDataPoint } from '@/types';

// Mock framer-motion (used by SwipeableSheetContent)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => 1,
  useAnimation: () => ({
    start: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Sheet component for easier testing
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="sheet-root">{children}</div> : null,
  SheetContent: ({
    children,
    'data-testid': testId,
    ...props
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
    side?: string;
    className?: string;
  }) => (
    <div data-testid={testId} {...props}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  SheetTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h2 className={className}>{children}</h2>,
}));

// Mock CompetitorEditPopover - spy on its rendering
vi.mock('./CompetitorEditPopover', () => ({
  CompetitorEditPopover: vi.fn(({ competitor, onEdit, onDelete }) => (
    <div data-testid="competitor-edit-popover">
      <span>{competitor.name}</span>
      <button onClick={onEdit} data-testid="popover-edit">
        Edit
      </button>
      <button onClick={onDelete} data-testid="popover-delete">
        Delete
      </button>
    </div>
  )),
}));

const mockCompetitor: CompetitorDataPoint = {
  id: 'test-id-123',
  name: 'Test Competitor',
  price_score: 7,
  quality_score: 8,
  is_kel_position: false,
  updated_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

const mockKelCompetitor: CompetitorDataPoint = {
  ...mockCompetitor,
  id: 'kel-position-123',
  name: 'Kel Target',
  is_kel_position: true,
};

describe('CompetitorDetailSheet', () => {
  const defaultProps = {
    competitor: mockCompetitor,
    open: true,
    onOpenChange: vi.fn(),
    anchorPoint: { x: 100, y: 200 },
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mobile rendering', () => {
    it('renders Sheet on mobile viewport', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.getByTestId('viz-competitor-modal-mobile')).toBeInTheDocument();
    });

    it('does not render Popover on mobile', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.queryByTestId('competitor-edit-popover')).not.toBeInTheDocument();
    });

    it('displays competitor name in Sheet header', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.getByText('Test Competitor')).toBeInTheDocument();
    });

    it('displays price score in mobile sheet', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.getByTestId('price-score')).toHaveTextContent('7/10');
    });

    it('displays quality score in mobile sheet', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.getByTestId('quality-score')).toHaveTextContent('8/10');
    });

    it('shows Kel badge when is_kel_position is true', () => {
      render(
        <CompetitorDetailSheet
          {...defaultProps}
          competitor={mockKelCompetitor}
          isMobile={true}
        />
      );

      expect(screen.getByTestId('kel-badge')).toBeInTheDocument();
      expect(screen.getByText('Kel')).toBeInTheDocument();
    });

    it('does not show Kel badge for regular competitors', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.queryByTestId('kel-badge')).not.toBeInTheDocument();
    });

    it('renders swipe handle for gesture dismissal', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.getByTestId('viz-modal-swipe-handle')).toBeInTheDocument();
    });

    it('renders Edit button with 48px min-height', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      const editButton = screen.getByTestId('competitor-edit-button');
      expect(editButton).toHaveClass('min-h-12');
    });

    it('renders Delete button with 48px min-height', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      const deleteButton = screen.getByTestId('competitor-delete-button');
      expect(deleteButton).toHaveClass('min-h-12');
    });

    it('calls onEdit and closes sheet when Edit clicked', () => {
      const onEdit = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <CompetitorDetailSheet
          {...defaultProps}
          isMobile={true}
          onEdit={onEdit}
          onOpenChange={onOpenChange}
        />
      );

      fireEvent.click(screen.getByTestId('competitor-edit-button'));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onDelete and closes sheet when Delete clicked', () => {
      const onDelete = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <CompetitorDetailSheet
          {...defaultProps}
          isMobile={true}
          onDelete={onDelete}
          onOpenChange={onOpenChange}
        />
      );

      fireEvent.click(screen.getByTestId('competitor-delete-button'));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not render when open is false', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={true} open={false} />);

      expect(screen.queryByTestId('viz-competitor-modal-mobile')).not.toBeInTheDocument();
    });
  });

  describe('desktop rendering', () => {
    it('renders Popover on desktop viewport', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={false} />);

      expect(screen.getByTestId('competitor-edit-popover')).toBeInTheDocument();
    });

    it('does not render Sheet on desktop', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={false} />);

      expect(screen.queryByTestId('viz-competitor-modal-mobile')).not.toBeInTheDocument();
    });

    it('passes competitor data to Popover', () => {
      render(<CompetitorDetailSheet {...defaultProps} isMobile={false} />);

      expect(screen.getByText('Test Competitor')).toBeInTheDocument();
    });

    it('passes callbacks to Popover', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <CompetitorDetailSheet
          {...defaultProps}
          isMobile={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      fireEvent.click(screen.getByTestId('popover-edit'));
      expect(onEdit).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('popover-delete'));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('responsive switching', () => {
    it('switches from Popover to Sheet when isMobile changes', () => {
      const { rerender } = render(
        <CompetitorDetailSheet {...defaultProps} isMobile={false} />
      );

      expect(screen.getByTestId('competitor-edit-popover')).toBeInTheDocument();
      expect(screen.queryByTestId('viz-competitor-modal-mobile')).not.toBeInTheDocument();

      rerender(<CompetitorDetailSheet {...defaultProps} isMobile={true} />);

      expect(screen.queryByTestId('competitor-edit-popover')).not.toBeInTheDocument();
      expect(screen.getByTestId('viz-competitor-modal-mobile')).toBeInTheDocument();
    });
  });
});
