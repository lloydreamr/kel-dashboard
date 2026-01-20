import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EvidencePanelSkeleton } from './EvidencePanelSkeleton';

describe('EvidencePanelSkeleton', () => {
  it('renders with correct test id', () => {
    render(<EvidencePanelSkeleton />);

    expect(screen.getByTestId('evidence-panel-skeleton')).toBeInTheDocument();
  });

  it('has accessibility attributes for loading state', () => {
    render(<EvidencePanelSkeleton />);

    const skeleton = screen.getByTestId('evidence-panel-skeleton');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading evidence details');
  });

  it('has pulse animation class', () => {
    render(<EvidencePanelSkeleton />);

    const skeleton = screen.getByTestId('evidence-panel-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders skeleton structure matching panel layout', () => {
    render(<EvidencePanelSkeleton />);

    const skeleton = screen.getByTestId('evidence-panel-skeleton');
    // Should have multiple skeleton placeholder elements
    const placeholders = skeleton.querySelectorAll('.bg-muted');
    expect(placeholders.length).toBeGreaterThanOrEqual(6); // header, url, excerpt, button
  });
});
