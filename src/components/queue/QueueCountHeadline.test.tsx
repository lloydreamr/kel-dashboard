import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QueueCountHeadline } from './QueueCountHeadline';

describe('QueueCountHeadline', () => {
  it('shows singular for 1 item', () => {
    render(<QueueCountHeadline count={1} />);
    expect(screen.getByTestId('queue-count-headline')).toHaveTextContent(
      '1 item ready for you'
    );
  });

  it('shows plural for multiple items', () => {
    render(<QueueCountHeadline count={5} />);
    expect(screen.getByTestId('queue-count-headline')).toHaveTextContent(
      '5 items ready for you'
    );
  });

  it('shows 10+ for counts over 10', () => {
    render(<QueueCountHeadline count={15} />);
    expect(screen.getByTestId('queue-count-headline')).toHaveTextContent(
      '10+ items ready for you'
    );
  });

  it('shows 10+ for exactly 11', () => {
    render(<QueueCountHeadline count={11} />);
    expect(screen.getByTestId('queue-count-headline')).toHaveTextContent(
      '10+ items ready for you'
    );
  });

  it('shows exact count for 10', () => {
    render(<QueueCountHeadline count={10} />);
    expect(screen.getByTestId('queue-count-headline')).toHaveTextContent(
      '10 items ready for you'
    );
  });

  it('shows 0 items for empty', () => {
    render(<QueueCountHeadline count={0} />);
    expect(screen.getByTestId('queue-count-headline')).toHaveTextContent(
      '0 items ready for you'
    );
  });
});
