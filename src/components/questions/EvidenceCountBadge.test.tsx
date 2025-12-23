import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { EvidenceCountBadge } from './EvidenceCountBadge';

describe('EvidenceCountBadge', () => {
  it('renders with correct test ID', () => {
    render(<EvidenceCountBadge count={0} />);
    expect(screen.getByTestId('evidence-count-badge')).toBeInTheDocument();
  });

  it('displays count of 0', () => {
    render(<EvidenceCountBadge count={0} />);
    expect(screen.getByText('0 evidence')).toBeInTheDocument();
  });

  it('displays count of 1', () => {
    render(<EvidenceCountBadge count={1} />);
    expect(screen.getByText('1 evidence')).toBeInTheDocument();
  });

  it('displays larger counts', () => {
    render(<EvidenceCountBadge count={5} />);
    expect(screen.getByText('5 evidence')).toBeInTheDocument();
  });

  it('renders document icon SVG', () => {
    render(<EvidenceCountBadge count={0} />);
    const badge = screen.getByTestId('evidence-count-badge');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
