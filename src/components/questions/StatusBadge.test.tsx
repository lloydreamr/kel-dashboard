import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  describe('decisionType prop (Story 4-10)', () => {
    it('shows status-badge-constrained when status=approved and decisionType=approved_with_constraint', () => {
      render(
        <StatusBadge status="approved" decisionType="approved_with_constraint" />
      );
      expect(screen.getByTestId('status-badge-constrained')).toBeInTheDocument();
    });

    it('shows status-badge-approved when status=approved and decisionType=approved', () => {
      render(<StatusBadge status="approved" decisionType="approved" />);
      expect(screen.getByTestId('status-badge-approved')).toBeInTheDocument();
    });

    it('shows status-badge-approved when status=approved and decisionType undefined', () => {
      render(<StatusBadge status="approved" />);
      expect(screen.getByTestId('status-badge-approved')).toBeInTheDocument();
    });

    it('shows chip icon only for constrained variant', () => {
      const { rerender } = render(
        <StatusBadge status="approved" decisionType="approved_with_constraint" />
      );
      expect(screen.getByTestId('constraint-chip-icon')).toBeInTheDocument();

      // Rerender without decisionType - no chip icon
      rerender(<StatusBadge status="approved" />);
      expect(screen.queryByTestId('constraint-chip-icon')).not.toBeInTheDocument();
    });
  });

  describe('per-status test IDs (Story 4-10)', () => {
    it('uses status-badge-draft for draft status', () => {
      render(<StatusBadge status="draft" />);
      expect(screen.getByTestId('status-badge-draft')).toBeInTheDocument();
    });

    it('uses status-badge-ready for ready_for_kel status', () => {
      render(<StatusBadge status="ready_for_kel" />);
      expect(screen.getByTestId('status-badge-ready')).toBeInTheDocument();
    });

    it('uses status-badge-approved for approved status', () => {
      render(<StatusBadge status="approved" />);
      expect(screen.getByTestId('status-badge-approved')).toBeInTheDocument();
    });

    it('uses status-badge-exploring for exploring_alternatives status', () => {
      render(<StatusBadge status="exploring_alternatives" />);
      expect(screen.getByTestId('status-badge-exploring')).toBeInTheDocument();
    });

    it('uses status-badge-archived for archived status', () => {
      render(<StatusBadge status="archived" />);
      expect(screen.getByTestId('status-badge-archived')).toBeInTheDocument();
    });
  });

  describe('status labels', () => {
    it('renders draft status correctly', () => {
      render(<StatusBadge status="draft" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('renders ready_for_kel status correctly', () => {
      render(<StatusBadge status="ready_for_kel" />);
      expect(screen.getByText('Sent to Kel')).toBeInTheDocument();
    });

    it('renders approved status correctly', () => {
      render(<StatusBadge status="approved" />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('renders exploring_alternatives status correctly', () => {
      render(<StatusBadge status="exploring_alternatives" />);
      expect(screen.getByText('Exploring')).toBeInTheDocument();
    });

    it('renders archived status correctly', () => {
      render(<StatusBadge status="archived" />);
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });
  });

  describe('pending state', () => {
    it('applies pending opacity when isPending=true', () => {
      render(<StatusBadge status="draft" isPending />);
      const badge = screen.getByTestId('status-badge-draft');
      expect(badge).toHaveClass('opacity-50');
    });

    it('does not apply pending opacity when isPending=false', () => {
      render(<StatusBadge status="draft" isPending={false} />);
      const badge = screen.getByTestId('status-badge-draft');
      expect(badge).not.toHaveClass('opacity-50');
    });
  });
});
