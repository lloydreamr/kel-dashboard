import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EvidenceList } from './EvidenceList';

import type { Evidence } from '@/types/evidence';

const mockEvidence: Evidence[] = [
  {
    id: 'e1',
    question_id: 'q1',
    title: 'Source 1',
    url: 'https://example1.com',
    section_anchor: null,
    excerpt: null,
    created_by: 'user1',
    created_at: '2024-12-24T00:00:00Z',
  },
  {
    id: 'e2',
    question_id: 'q1',
    title: 'Source 2',
    url: 'https://example2.com',
    section_anchor: '#section',
    excerpt: 'Some excerpt text',
    created_by: 'user1',
    created_at: '2024-12-24T01:00:00Z',
  },
];

describe('EvidenceList', () => {
  it('renders loading skeleton when isLoading', () => {
    render(
      <EvidenceList
        evidence={undefined}
        isLoading={true}
        role="maho"
      />
    );

    expect(screen.getByTestId('evidence-list-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('evidence-list')).not.toBeInTheDocument();
  });

  it('renders Maho empty state when no evidence', () => {
    render(
      <EvidenceList
        evidence={[]}
        isLoading={false}
        role="maho"
      />
    );

    expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Add sources to support/)).toBeInTheDocument();
  });

  it('renders Kel empty state when no evidence', () => {
    render(
      <EvidenceList
        evidence={[]}
        isLoading={false}
        role="kel"
      />
    );

    expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/No supporting evidence provided/)).toBeInTheDocument();
  });

  it('renders evidence items with correct numbers', () => {
    render(
      <EvidenceList
        evidence={mockEvidence}
        isLoading={false}
        role="maho"
      />
    );

    expect(screen.getByTestId('evidence-list')).toBeInTheDocument();
    const items = screen.getAllByTestId('evidence-item');
    expect(items).toHaveLength(2);

    const numbers = screen.getAllByTestId('evidence-number');
    expect(numbers[0]).toHaveTextContent('1');
    expect(numbers[1]).toHaveTextContent('2');
  });

  it('calls onItemClick with correct evidence when item clicked', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(
      <EvidenceList
        evidence={mockEvidence}
        isLoading={false}
        role="maho"
        onItemClick={onItemClick}
      />
    );

    const items = screen.getAllByTestId('evidence-item');
    await user.click(items[1]);

    expect(onItemClick).toHaveBeenCalledWith(mockEvidence[1]);
  });

  it('renders empty state for undefined evidence', () => {
    render(
      <EvidenceList
        evidence={undefined}
        isLoading={false}
        role="maho"
      />
    );

    expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
  });

  it('calls onEditClick with correct evidence when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEditClick = vi.fn();
    render(
      <EvidenceList
        evidence={mockEvidence}
        isLoading={false}
        role="maho"
        onEditClick={onEditClick}
      />
    );

    const editButtons = screen.getAllByTestId('evidence-edit-button');
    await user.click(editButtons[0]);

    expect(onEditClick).toHaveBeenCalledWith(mockEvidence[0]);
  });

  it('calls onRemoveClick with correct evidence when remove button clicked', async () => {
    const user = userEvent.setup();
    const onRemoveClick = vi.fn();
    render(
      <EvidenceList
        evidence={mockEvidence}
        isLoading={false}
        role="maho"
        onRemoveClick={onRemoveClick}
      />
    );

    const removeButtons = screen.getAllByTestId('evidence-remove-button');
    await user.click(removeButtons[1]);

    expect(onRemoveClick).toHaveBeenCalledWith(mockEvidence[1]);
  });

  it('hides edit/remove buttons when role is kel', () => {
    render(
      <EvidenceList
        evidence={mockEvidence}
        isLoading={false}
        role="kel"
        onEditClick={vi.fn()}
        onRemoveClick={vi.fn()}
      />
    );

    expect(screen.queryByTestId('evidence-edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('evidence-remove-button')).not.toBeInTheDocument();
  });
});
