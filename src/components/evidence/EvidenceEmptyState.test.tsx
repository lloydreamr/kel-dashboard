import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EvidenceEmptyState } from './EvidenceEmptyState';

describe('EvidenceEmptyState', () => {
  it('shows Maho message for maho role', () => {
    render(<EvidenceEmptyState role="maho" />);

    expect(
      screen.getByText(/Add sources to support your recommendation/)
    ).toBeInTheDocument();
  });

  it('shows Kel message for kel role', () => {
    render(<EvidenceEmptyState role="kel" />);

    expect(
      screen.getByText(/No supporting evidence provided/)
    ).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<EvidenceEmptyState role="maho" />);

    expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
  });
});
