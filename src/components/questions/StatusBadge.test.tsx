import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders with correct test ID', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByTestId('question-status')).toBeInTheDocument();
  });

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

  it('applies pending opacity when isPending=true', () => {
    render(<StatusBadge status="draft" isPending />);
    const badge = screen.getByTestId('question-status');
    expect(badge).toHaveClass('opacity-50');
  });

  it('does not apply pending opacity when isPending=false', () => {
    render(<StatusBadge status="draft" isPending={false} />);
    const badge = screen.getByTestId('question-status');
    expect(badge).not.toHaveClass('opacity-50');
  });
});
