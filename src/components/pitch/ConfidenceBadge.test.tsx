import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfidenceBadge } from './ConfidenceBadge';

describe('ConfidenceBadge', () => {
  describe('confidence levels', () => {
    it('shows high confidence styling for scores >= 0.8', () => {
      render(<ConfidenceBadge score={0.85} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('85%');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('shows medium confidence styling for scores 0.5-0.79', () => {
      render(<ConfidenceBadge score={0.65} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('65%');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('shows low confidence styling for scores < 0.5', () => {
      render(<ConfidenceBadge score={0.3} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('30%');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('shows unknown state when score is null', () => {
      render(<ConfidenceBadge score={null} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('Unknown');
      expect(badge).toHaveClass('bg-gray-100');
    });
  });

  describe('label display', () => {
    it('shows only percentage by default', () => {
      render(<ConfidenceBadge score={0.85} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('85%');
      expect(badge).not.toHaveTextContent('High');
    });

    it('shows label with percentage when showLabel is true', () => {
      render(<ConfidenceBadge score={0.85} showLabel />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('High:');
      expect(badge).toHaveTextContent('85%');
    });

    it('shows Medium label for medium confidence', () => {
      render(<ConfidenceBadge score={0.65} showLabel />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('Medium:');
    });

    it('shows Low label for low confidence', () => {
      render(<ConfidenceBadge score={0.25} showLabel />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('Low:');
    });
  });

  describe('boundary conditions', () => {
    it('treats exactly 0.8 as high confidence', () => {
      render(<ConfidenceBadge score={0.8} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('treats exactly 0.5 as medium confidence', () => {
      render(<ConfidenceBadge score={0.5} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('treats 0.49 as low confidence', () => {
      render(<ConfidenceBadge score={0.49} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('handles 0 score as low confidence', () => {
      render(<ConfidenceBadge score={0} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('0%');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('handles 1.0 (100%) score', () => {
      render(<ConfidenceBadge score={1} />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveTextContent('100%');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('custom className', () => {
    it('applies custom className to badge', () => {
      render(<ConfidenceBadge score={0.85} className="custom-class" />);

      const badge = screen.getByTestId('confidence-badge');
      expect(badge).toHaveClass('custom-class');
    });
  });
});
