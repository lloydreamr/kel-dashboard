'use client';

/**
 * useCommandPalette Hook
 *
 * Manages command palette open/close state and keyboard shortcuts.
 * Listens for Cmd/Ctrl+K to open the palette.
 */

import { useCallback, useEffect, useState } from 'react';

export interface UseCommandPaletteResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook for managing command palette state with keyboard shortcut support.
 *
 * @returns Command palette state and controls
 *
 * @example
 * const { isOpen, open, close, toggle } = useCommandPalette();
 * // Automatically handles Cmd/Ctrl+K keyboard shortcut
 */
export function useCommandPalette(): UseCommandPaletteResult {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
