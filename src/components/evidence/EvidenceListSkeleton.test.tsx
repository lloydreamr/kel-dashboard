import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EvidenceListSkeleton } from './EvidenceListSkeleton';

describe('EvidenceListSkeleton', () => {
  it('renders with correct test id', () => {
    render(<EvidenceListSkeleton />);

    expect(screen.getByTestId('evidence-list-skeleton')).toBeInTheDocument();
  });

  it('renders exactly 3 placeholder items', () => {
    render(<EvidenceListSkeleton />);

    const container = screen.getByTestId('evidence-list-skeleton');
    const placeholders = container.querySelectorAll('.animate-pulse');
    // Each placeholder has 4 animated elements (number, favicon, title, domain)
    expect(placeholders.length).toBe(12); // 3 items × 4 elements
  });

  it('has accessibility attributes for loading state', () => {
    render(<EvidenceListSkeleton />);

    const skeleton = screen.getByTestId('evidence-list-skeleton');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading evidence');
  });

  it('has correct structure for each skeleton item', () => {
    render(<EvidenceListSkeleton />);

    const container = screen.getByTestId('evidence-list-skeleton');
    const items = container.children;
    expect(items.length).toBe(3);

    // Each item should have the card styling
    Array.from(items).forEach((item) => {
      expect(item).toHaveClass('rounded-lg', 'border', 'border-border');
    });
  });
});
