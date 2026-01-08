import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useKeyboardShortcuts, keyboardShortcuts } from './useKeyboardShortcuts';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  // Helper to dispatch keyboard events
  function dispatchKeydown(key: string, options: Partial<KeyboardEvent> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  }

  describe('event listener management', () => {
    it('adds keydown listener on mount when enabled', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('does not add listener when disabled', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: false }));

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('removes listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ enabled: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('navigation shortcuts', () => {
    it('navigates to dashboard on "1" key', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('1');

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('navigates to questions on "2" key', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('2');

      expect(mockPush).toHaveBeenCalledWith('/questions');
    });

    it('navigates to visualization on "3" key', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('3');

      expect(mockPush).toHaveBeenCalledWith('/visualization');
    });

    it('navigates to progress on "4" key', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('4');

      expect(mockPush).toHaveBeenCalledWith('/progress');
    });
  });

  describe('action shortcuts', () => {
    it('navigates to questions with action=new on "n" key', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('n');

      expect(mockPush).toHaveBeenCalledWith('/questions?action=new');
    });

    it('navigates to questions with action=new on "N" key', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('N');

      expect(mockPush).toHaveBeenCalledWith('/questions?action=new');
    });
  });

  describe('help overlay toggle', () => {
    it('calls onToggleHelp on "?" key', () => {
      const onToggleHelp = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts({ enabled: true, onToggleHelp })
      );

      dispatchKeydown('?');

      expect(onToggleHelp).toHaveBeenCalledTimes(1);
    });
  });

  describe('escape key', () => {
    it('calls onEscape on Escape key', () => {
      const onEscape = vi.fn();
      renderHook(() => useKeyboardShortcuts({ enabled: true, onEscape }));

      dispatchKeydown('Escape');

      expect(onEscape).toHaveBeenCalledTimes(1);
    });
  });

  describe('input guarding', () => {
    it('does not fire shortcuts when typing in input', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      // Create an input element and focus it
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      dispatchKeydown('1');

      expect(mockPush).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('does not fire shortcuts when typing in textarea', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      dispatchKeydown('n');

      expect(mockPush).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('does not fire shortcuts when typing in contenteditable', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);
      div.focus();

      dispatchKeydown('n');

      expect(mockPush).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('still fires Escape when typing in input', () => {
      const onEscape = vi.fn();
      renderHook(() => useKeyboardShortcuts({ enabled: true, onEscape }));

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      dispatchKeydown('Escape');

      expect(onEscape).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('modifier key guarding', () => {
    it('does not fire shortcuts with Ctrl held', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('1', { ctrlKey: true });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not fire shortcuts with Meta (Cmd) held', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('1', { metaKey: true });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not fire shortcuts with Alt held', () => {
      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      dispatchKeydown('1', { altKey: true });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('does not fire shortcuts when disabled', () => {
      const onToggleHelp = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts({ enabled: false, onToggleHelp })
      );

      dispatchKeydown('?');

      expect(onToggleHelp).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

describe('keyboardShortcuts configuration', () => {
  it('exports keyboard shortcuts for display', () => {
    expect(keyboardShortcuts).toBeDefined();
    expect(keyboardShortcuts.length).toBeGreaterThan(0);
  });

  it('includes expected shortcuts', () => {
    const keys = keyboardShortcuts.map((s) => s.key);

    expect(keys).toContain('N');
    expect(keys).toContain('?');
    expect(keys).toContain('1');
    expect(keys).toContain('2');
    expect(keys).toContain('3');
    expect(keys).toContain('4');
    expect(keys).toContain('Esc');
  });

  it('each shortcut has required properties', () => {
    keyboardShortcuts.forEach((shortcut) => {
      expect(shortcut).toHaveProperty('key');
      expect(shortcut).toHaveProperty('description');
      expect(shortcut).toHaveProperty('category');
    });
  });
});
