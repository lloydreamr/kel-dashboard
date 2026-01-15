/**
 * useKeyboardShortcuts Hook
 *
 * Global keyboard shortcuts for power users.
 * Guards against firing when typing in inputs/textareas.
 *
 * Shortcuts:
 * - N: New question (navigates to /questions with create action)
 * - ?: Toggle help overlay
 * - 1-4: Navigate to main sections
 * - Esc: Close modals/overlays
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { navLinks } from '@/components/layout/nav-links';

interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Callback when help overlay should toggle */
  onToggleHelp?: () => void;
  /** Callback when escape is pressed (for closing overlays) */
  onEscape?: () => void;
}

/**
 * Check if the active element is an input where typing should be allowed
 */
function isTypingTarget(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isEditable = element.getAttribute('contenteditable') === 'true';

  return isInput || isEditable;
}

export function useKeyboardShortcuts({
  enabled = true,
  onToggleHelp,
  onEscape,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't fire shortcuts when typing in inputs
      if (isTypingTarget(document.activeElement)) {
        // Exception: Escape should always work
        if (event.key === 'Escape' && onEscape) {
          onEscape();
        }
        return;
      }

      // Don't fire with modifier keys (except shift for ?)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key) {
        case 'n':
        case 'N':
          event.preventDefault();
          router.push('/questions?action=new');
          break;

        case '?':
          event.preventDefault();
          onToggleHelp?.();
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5': {
          const index = parseInt(event.key, 10) - 1;
          if (navLinks[index]) {
            event.preventDefault();
            router.push(navLinks[index].href);
          }
          break;
        }

        case 'Escape':
          onEscape?.();
          break;
      }
    },
    [enabled, router, onToggleHelp, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Keyboard shortcuts configuration for display in help overlay
 */
export const keyboardShortcuts = [
  { key: 'N', description: 'New question', category: 'Actions' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
  { key: '1', description: 'Go to Dashboard', category: 'Navigation' },
  { key: '2', description: 'Go to Questions', category: 'Navigation' },
  { key: '3', description: 'Go to Progress', category: 'Navigation' },
  { key: '4', description: 'Go to Market Intel', category: 'Navigation' },
  { key: '5', description: 'Go to Visualization', category: 'Navigation' },
  { key: 'Esc', description: 'Close dialog/overlay', category: 'General' },
] as const;
