'use client';

/**
 * Sidebar Component
 *
 * Desktop navigation sidebar with links and user section.
 * Receives userEmail from server component layout.
 *
 * AC: #1 (Desktop Navigation), #3 (User Section)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { DashboardSyncIndicator } from './DashboardSyncIndicator';
import { LogoutButton } from './LogoutButton';
import { navLinks } from './nav-links';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  userEmail: string;
  className?: string;
}

export function Sidebar({ userEmail, className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Exact match for dashboard, prefix match for other routes
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      data-testid="nav-sidebar"
      className={cn(
        'flex flex-col bg-background border-r border-border',
        className
      )}
    >
      {/* Logo/Brand Area */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Kel Dashboard</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              data-testid={link.testId}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md min-h-[48px]',
                'hover:bg-accent/50 transition-colors',
                active && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
              {active && (
                <span
                  data-testid="nav-active-indicator"
                  className="sr-only"
                >
                  (current page)
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4 space-y-2">
        <div
          data-testid="nav-user-section"
          className="flex items-center gap-3 px-3 py-2"
        >
          <UserAvatar email={userEmail} />
          <span className="text-sm text-muted-foreground truncate flex-1">
            {userEmail}
          </span>
        </div>
        <div className="flex items-center justify-between px-3">
          <DashboardSyncIndicator />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
