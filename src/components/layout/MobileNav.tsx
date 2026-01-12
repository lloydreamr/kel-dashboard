'use client';

/**
 * MobileNav Component
 *
 * Mobile header with hamburger menu button.
 * Controls the mobile navigation drawer via navigation store.
 *
 * AC: #2 (Mobile Navigation - hamburger menu)
 */

import { Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';

import { DashboardSyncIndicator } from './DashboardSyncIndicator';
import { MobileNavDrawer } from './MobileNavDrawer';

interface MobileNavProps {
  userEmail: string;
  className?: string;
}

export function MobileNav({ userEmail, className }: MobileNavProps) {
  const toggle = useNavigationStore((s) => s.toggle);

  return (
    <>
      {/* Mobile Header */}
      <header
        className={cn(
          'bg-background border-b border-border px-4 py-3',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Kel Dashboard</h1>
          <div className="flex items-center gap-3">
            <DashboardSyncIndicator />
            <button
              type="button"
              data-testid="nav-hamburger"
              onClick={toggle}
              className="flex items-center justify-center min-h-12 min-w-12 rounded-md hover:bg-accent/50 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNavDrawer userEmail={userEmail} />
    </>
  );
}
