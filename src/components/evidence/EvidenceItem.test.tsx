import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EvidenceItem } from './EvidenceItem';

import type { Evidence } from '@/types/evidence';

const mockEvidence: Evidence = {
  id: 'e1',
  question_id: 'q1',
  title: 'Market Research Report',
  url: 'https://example.com/report',
  section_anchor: '#pricing',
  excerpt: 'This report shows pricing trends in the market.',
  created_by: 'user1',
  created_at: '2024-12-24T00:00:00Z',
};

describe('EvidenceItem', () => {
  it('renders evidence details', () => {
    render(<EvidenceItem evidence={mockEvidence} number={1} />);

    expect(screen.getByTestId('evidence-item')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-number')).toHaveTextContent('1');
    expect(screen.getByTestId('evidence-title')).toHaveTextContent(
      'Market Research Report'
    );
    expect(screen.getByTestId('evidence-domain')).toHaveTextContent(
      'example.com'
    );
    expect(screen.getByTestId('evidence-excerpt')).toHaveTextContent(
      'This report shows pricing trends'
    );
  });

  it('renders without excerpt when not provided', () => {
    const evidenceNoExcerpt = { ...mockEvidence, excerpt: null };
    render(<EvidenceItem evidence={evidenceNoExcerpt} number={2} />);

    expect(screen.getByTestId('evidence-number')).toHaveTextContent('2');
    expect(screen.queryByTestId('evidence-excerpt')).not.toBeInTheDocument();
  });

  it('renders favicon with correct src', () => {
    render(<EvidenceItem evidence={mockEvidence} number={1} />);

    const favicon = screen.getByTestId('evidence-favicon');
    expect(favicon).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?domain=example.com&sz=32'
    );
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EvidenceItem evidence={mockEvidence} number={1} onClick={onClick} />);

    await user.click(screen.getByTestId('evidence-item'));

    expect(onClick).toHaveBeenCalled();
  });

  it('has accessible button with aria-label', () => {
    render(<EvidenceItem evidence={mockEvidence} number={1} />);

    const button = screen.getByTestId('evidence-item');
    expect(button).toHaveAttribute(
      'aria-label',
      'View evidence: Market Research Report'
    );
  });

  it('displays correct number for each item', () => {
    const { rerender } = render(
      <EvidenceItem evidence={mockEvidence} number={5} />
    );
    expect(screen.getByTestId('evidence-number')).toHaveTextContent('5');

    rerender(<EvidenceItem evidence={mockEvidence} number={10} />);
    expect(screen.getByTestId('evidence-number')).toHaveTextContent('10');
  });

  describe('action buttons', () => {
    it('hides action buttons when canModify is false', () => {
      render(
        <EvidenceItem
          evidence={mockEvidence}
          number={1}
          canModify={false}
          onEdit={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.queryByTestId('evidence-edit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('evidence-remove-button')).not.toBeInTheDocument();
    });

    it('shows action buttons when canModify is true', () => {
      render(
        <EvidenceItem
          evidence={mockEvidence}
          number={1}
          canModify={true}
          onEdit={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.getByTestId('evidence-edit-button')).toBeInTheDocument();
      expect(screen.getByTestId('evidence-remove-button')).toBeInTheDocument();
    });

    it('calls onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();
      render(
        <EvidenceItem
          evidence={mockEvidence}
          number={1}
          canModify={true}
          onEdit={mockOnEdit}
          onRemove={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('evidence-edit-button'));

      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('calls onRemove when remove button clicked', async () => {
      const user = userEvent.setup();
      const mockOnRemove = vi.fn();
      render(
        <EvidenceItem
          evidence={mockEvidence}
          number={1}
          canModify={true}
          onEdit={vi.fn()}
          onRemove={mockOnRemove}
        />
      );

      await user.click(screen.getByTestId('evidence-remove-button'));

      expect(mockOnRemove).toHaveBeenCalled();
    });

    it('does not trigger onClick when action buttons are clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(
        <EvidenceItem
          evidence={mockEvidence}
          number={1}
          onClick={mockOnClick}
          canModify={true}
          onEdit={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('evidence-edit-button'));
      await user.click(screen.getByTestId('evidence-remove-button'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('has 48px touch targets for accessibility', () => {
      render(
        <EvidenceItem
          evidence={mockEvidence}
          number={1}
          canModify={true}
          onEdit={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.getByTestId('evidence-edit-button')).toHaveClass('h-[48px]', 'w-[48px]');
      expect(screen.getByTestId('evidence-remove-button')).toHaveClass('h-[48px]', 'w-[48px]');
    });
  });
});
