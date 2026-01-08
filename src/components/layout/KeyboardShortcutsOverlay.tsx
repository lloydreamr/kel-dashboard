'use client';

/**
 * KeyboardShortcutsOverlay Component
 *
 * Modal overlay showing available keyboard shortcuts.
 * Triggered by pressing '?' key.
 */

import { Keyboard } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { keyboardShortcuts } from '@/hooks/ui/useKeyboardShortcuts';

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsOverlay({
  open,
  onOpenChange,
}: KeyboardShortcutsOverlayProps) {
  // Group shortcuts by category
  const shortcutsByCategory = keyboardShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof keyboardShortcuts[number][]>
  );

  const categoryOrder = ['Actions', 'Navigation', 'General', 'Help'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="keyboard-shortcuts-overlay"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {categoryOrder.map((category) => {
            const shortcuts = shortcutsByCategory[category];
            if (!shortcuts) return null;

            return (
              <div key={category}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between"
                      data-testid={`shortcut-${shortcut.key.toLowerCase().replace('?', 'help')}`}
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-2 font-mono text-xs text-muted-foreground">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Press <kbd className="rounded border border-border bg-muted px-1 font-mono text-xs">Esc</kbd> to close
        </p>
      </DialogContent>
    </Dialog>
  );
}
