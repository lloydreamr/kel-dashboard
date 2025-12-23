import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CategoryBadge } from './CategoryBadge';

// Mock hooks
const mockMutate = vi.fn();
let mockIsPending = false;

vi.mock('@/hooks/questions/useUpdateQuestion', () => ({
  useUpdateQuestion: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}));

describe('CategoryBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  describe('when not editable', () => {
    it('renders static badge with category', () => {
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={false} />
      );

      const badge = screen.getByTestId('category-badge');
      expect(badge).toHaveTextContent('market');
      expect(badge.tagName).toBe('SPAN');
    });

    it('does not render dropdown trigger', () => {
      render(
        <CategoryBadge questionId="q1" category="product" isEditable={false} />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('when editable', () => {
    it('renders as button with chevron', () => {
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      const button = screen.getByTestId('category-badge');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveTextContent('market');
    });

    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      await user.click(screen.getByTestId('category-badge'));

      expect(screen.getByTestId('category-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-market')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-product')).toBeInTheDocument();
      expect(
        screen.getByTestId('category-option-distribution')
      ).toBeInTheDocument();
    });

    it('shows checkmark for current category', async () => {
      const user = userEvent.setup();
      render(
        <CategoryBadge questionId="q1" category="product" isEditable={true} />
      );

      await user.click(screen.getByTestId('category-badge'));

      const productOption = screen.getByTestId('category-option-product');
      expect(productOption.querySelector('svg')).toBeInTheDocument();
    });

    it('calls updateQuestion when selecting different category', async () => {
      const user = userEvent.setup();
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      await user.click(screen.getByTestId('category-badge'));
      await user.click(screen.getByTestId('category-option-product'));

      expect(mockMutate).toHaveBeenCalledWith(
        {
          id: 'q1',
          updates: { category: 'product' },
        },
        expect.any(Object)
      );
    });

    it('does not call updateQuestion when selecting same category', async () => {
      const user = userEvent.setup();
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      await user.click(screen.getByTestId('category-badge'));
      await user.click(screen.getByTestId('category-option-market'));

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('closes dropdown on successful update', async () => {
      mockMutate.mockImplementation((_, options) => {
        options.onSuccess();
      });

      const user = userEvent.setup();
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      await user.click(screen.getByTestId('category-badge'));
      await user.click(screen.getByTestId('category-option-distribution'));

      // Dropdown should be closed after successful update
      expect(screen.queryByTestId('category-dropdown')).not.toBeInTheDocument();
    });

    it('provides onSuccess and onError callbacks to mutation', async () => {
      const user = userEvent.setup();
      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      await user.click(screen.getByTestId('category-badge'));
      await user.click(screen.getByTestId('category-option-product'));

      // Verify callbacks are provided to the mutation
      const callOptions = mockMutate.mock.calls[0][1];
      expect(callOptions).toHaveProperty('onSuccess');
      expect(callOptions).toHaveProperty('onError');
    });
  });

  describe('pending state', () => {
    it('shows updating text when pending', () => {
      mockIsPending = true;

      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      expect(screen.getByTestId('category-badge')).toHaveTextContent(
        'Updating...'
      );
    });

    it('disables button when pending', () => {
      mockIsPending = true;

      render(
        <CategoryBadge questionId="q1" category="market" isEditable={true} />
      );

      expect(screen.getByTestId('category-badge')).toBeDisabled();
    });
  });
});
