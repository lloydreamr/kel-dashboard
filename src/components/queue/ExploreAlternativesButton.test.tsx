import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExploreAlternativesButton } from './ExploreAlternativesButton';

describe('ExploreAlternativesButton', () => {
  it('renders with correct text', () => {
    render(
      <ExploreAlternativesButton expanded={false} onToggle={() => {}} />
    );
    expect(
      screen.getByTestId('explore-alternatives-button')
    ).toHaveTextContent('Explore Alternatives');
  });

  it('has correct test-id', () => {
    render(
      <ExploreAlternativesButton expanded={false} onToggle={() => {}} />
    );
    expect(
      screen.getByTestId('explore-alternatives-button')
    ).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const mockOnToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesButton expanded={false} onToggle={mockOnToggle} />
    );

    await user.click(screen.getByTestId('explore-alternatives-button'));

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('has aria-expanded false when not expanded', () => {
    render(
      <ExploreAlternativesButton expanded={false} onToggle={() => {}} />
    );
    expect(screen.getByTestId('explore-alternatives-button')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('has aria-expanded true when expanded', () => {
    render(
      <ExploreAlternativesButton expanded={true} onToggle={() => {}} />
    );
    expect(screen.getByTestId('explore-alternatives-button')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ExploreAlternativesButton
        expanded={false}
        onToggle={() => {}}
        disabled={true}
      />
    );
    expect(screen.getByTestId('explore-alternatives-button')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(
      <ExploreAlternativesButton expanded={false} onToggle={() => {}} />
    );
    expect(
      screen.getByTestId('explore-alternatives-button')
    ).not.toBeDisabled();
  });

  it('does not call onToggle when disabled', async () => {
    const mockOnToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <ExploreAlternativesButton
        expanded={false}
        onToggle={mockOnToggle}
        disabled={true}
      />
    );

    await user.click(screen.getByTestId('explore-alternatives-button'));

    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(
      <ExploreAlternativesButton
        expanded={false}
        onToggle={() => {}}
        className="custom-class"
      />
    );
    expect(screen.getByTestId('explore-alternatives-button')).toHaveClass(
      'custom-class'
    );
  });

  it('has minimum 48px height for touch target', () => {
    render(
      <ExploreAlternativesButton expanded={false} onToggle={() => {}} />
    );
    expect(screen.getByTestId('explore-alternatives-button')).toHaveClass(
      'min-h-[48px]'
    );
  });
});
