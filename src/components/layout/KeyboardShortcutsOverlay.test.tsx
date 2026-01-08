import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

describe('KeyboardShortcutsOverlay', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  it('renders when open is true', () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);

    expect(screen.getByTestId('keyboard-shortcuts-overlay')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} open={false} />);

    expect(screen.queryByTestId('keyboard-shortcuts-overlay')).not.toBeInTheDocument();
  });

  it('displays the title', () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays the description', () => {
    render(<KeyboardShortcutsOverlay {...defaultProps} />);

    expect(
      screen.getByText('Use these shortcuts to navigate faster')
    ).toBeInTheDocument();
  });

  describe('shortcut display', () => {
    it('displays Navigation shortcuts', () => {
      render(<KeyboardShortcutsOverlay {...defaultProps} />);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Go to Questions')).toBeInTheDocument();
      expect(screen.getByText('Go to Visualization')).toBeInTheDocument();
      expect(screen.getByText('Go to Progress')).toBeInTheDocument();
    });

    it('displays Actions shortcuts', () => {
      render(<KeyboardShortcutsOverlay {...defaultProps} />);

      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('New question')).toBeInTheDocument();
    });

    it('displays Help shortcuts', () => {
      render(<KeyboardShortcutsOverlay {...defaultProps} />);

      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
    });

    it('displays General shortcuts', () => {
      render(<KeyboardShortcutsOverlay {...defaultProps} />);

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Close dialog/overlay')).toBeInTheDocument();
    });

    it('displays keyboard key indicators', () => {
      render(<KeyboardShortcutsOverlay {...defaultProps} />);

      // Check for kbd elements with specific keys
      expect(screen.getByTestId('shortcut-n')).toBeInTheDocument();
      expect(screen.getByTestId('shortcut-help')).toBeInTheDocument();
      expect(screen.getByTestId('shortcut-1')).toBeInTheDocument();
      expect(screen.getByTestId('shortcut-esc')).toBeInTheDocument();
    });
  });

  describe('closing behavior', () => {
    it('displays Esc hint for closing', () => {
      render(<KeyboardShortcutsOverlay {...defaultProps} />);

      // Text is split across elements, use a function matcher
      expect(
        screen.getByText((content, element) => {
          return element?.tagName === 'P' && content.includes('Press') && element.textContent?.includes('to close');
        })
      ).toBeInTheDocument();
    });

    it('calls onOpenChange when close button clicked', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(
        <KeyboardShortcutsOverlay open={true} onOpenChange={onOpenChange} />
      );

      // Find and click the close button (X)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
