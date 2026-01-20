import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EvidenceEmptyState } from './EvidenceEmptyState';

describe('EvidenceEmptyState', () => {
  it('shows Maho message when isMaho is true', () => {
    render(<EvidenceEmptyState isMaho />);

    expect(
      screen.getByText(/Add sources to support your recommendation/)
    ).toBeInTheDocument();
  });

  it('shows Kel message when isMaho is false (default)', () => {
    render(<EvidenceEmptyState />);

    expect(
      screen.getByText(/No supporting evidence provided/)
    ).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<EvidenceEmptyState isMaho />);

    expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<EvidenceEmptyState />);

    const emptyState = screen.getByTestId('evidence-empty-state');
    expect(emptyState).toHaveAttribute('role', 'status');
    expect(emptyState).toHaveAttribute('aria-label', 'No evidence available');
  });

  it('uses consistent dashed border styling', () => {
    render(<EvidenceEmptyState />);

    const emptyState = screen.getByTestId('evidence-empty-state');
    expect(emptyState).toHaveClass('border-dashed');
    expect(emptyState).toHaveClass('border-border');
    expect(emptyState).toHaveClass('bg-muted/20');
  });
});
