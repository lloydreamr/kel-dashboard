'use client';

/**
 * LogoutButton Component
 *
 * Handles logout flow using server action.
 * Clears draft responses from queue store before signing out.
 *
 * AC: #3 (Logout option)
 */

import { LogOut } from 'lucide-react';

import { logout } from '@/app/(dashboard)/actions';
import { useQueueStore } from '@/stores/queue';

export function LogoutButton() {
  const clearAllDrafts = useQueueStore((s) => s.clearAllDrafts);

  const handleLogout = () => {
    // Clear drafts before server action redirects
    clearAllDrafts();
  };

  return (
    <form action={logout} onSubmit={handleLogout}>
      <button
        type="submit"
        data-testid="nav-logout"
        className="flex items-center gap-3 px-3 py-2 rounded-md min-h-12 w-full text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
