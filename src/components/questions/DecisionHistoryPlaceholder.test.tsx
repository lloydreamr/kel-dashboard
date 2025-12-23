import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { DecisionHistoryPlaceholder } from './DecisionHistoryPlaceholder';

describe('DecisionHistoryPlaceholder', () => {
  it('renders with correct test ID', () => {
    render(<DecisionHistoryPlaceholder questionId="q-123" />);
    expect(screen.getByTestId('decision-history-placeholder')).toBeInTheDocument();
  });

  it('displays placeholder message', () => {
    render(<DecisionHistoryPlaceholder questionId="q-123" />);
    expect(screen.getByText('Decision history will appear here')).toBeInTheDocument();
  });

  it('accepts questionId prop without error', () => {
    // This test ensures the component can accept the prop that will be used in Epic 4
    expect(() => render(<DecisionHistoryPlaceholder questionId="q-456" />)).not.toThrow();
  });
});
