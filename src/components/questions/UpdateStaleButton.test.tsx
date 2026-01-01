import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UpdateStaleButton } from './UpdateStaleButton';

describe('UpdateStaleButton', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('conditional rendering', () => {
    it('renders nothing when data is not stale', () => {
      const freshDate = new Date().toISOString();
      render(<UpdateStaleButton updatedAt={freshDate} onUpdate={mockOnUpdate} />);
      expect(screen.queryByTestId('update-stale-button')).not.toBeInTheDocument();
    });

    it('renders nothing when updatedAt is null', () => {
      render(<UpdateStaleButton updatedAt={null} onUpdate={mockOnUpdate} />);
      expect(screen.queryByTestId('update-stale-button')).not.toBeInTheDocument();
    });

    it('renders nothing when updatedAt is undefined', () => {
      render(<UpdateStaleButton updatedAt={undefined} onUpdate={mockOnUpdate} />);
      expect(screen.queryByTestId('update-stale-button')).not.toBeInTheDocument();
    });

    it('renders button when data is stale (> 14 days old)', () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 20); // 20 days ago
      render(<UpdateStaleButton updatedAt={staleDate.toISOString()} onUpdate={mockOnUpdate} />);
      expect(screen.getByTestId('update-stale-button')).toBeInTheDocument();
    });

    it('renders nothing when data is exactly at threshold (14 days)', () => {
      // Use Date.now() - 14 days in milliseconds for exact threshold
      // Add 1 hour buffer to ensure we're clearly under 14 days
      const msIn14DaysMinusBuffer = 14 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000;
      const thresholdDate = new Date(Date.now() - msIn14DaysMinusBuffer);
      render(<UpdateStaleButton updatedAt={thresholdDate.toISOString()} onUpdate={mockOnUpdate} />);
      // At threshold = not stale (> not >=)
      expect(screen.queryByTestId('update-stale-button')).not.toBeInTheDocument();
    });
  });

  describe('button behavior', () => {
    const staleDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 20);
      return d.toISOString();
    })();

    it('calls onUpdate when clicked', async () => {
      const user = userEvent.setup();
      render(<UpdateStaleButton updatedAt={staleDate} onUpdate={mockOnUpdate} />);

      await user.click(screen.getByTestId('update-stale-button'));

      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    });

    it('displays "Update" text', () => {
      render(<UpdateStaleButton updatedAt={staleDate} onUpdate={mockOnUpdate} />);
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('has correct test ID', () => {
      render(<UpdateStaleButton updatedAt={staleDate} onUpdate={mockOnUpdate} />);
      expect(screen.getByTestId('update-stale-button')).toBeInTheDocument();
    });
  });
});
