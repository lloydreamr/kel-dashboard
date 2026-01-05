'use client';

/**
 * MobileNavDrawer Component
 *
 * Slide-out navigation drawer for mobile viewports.
 * Uses Framer Motion for smooth animations.
 *
 * AC: #2 (Mobile Navigation - slide-out drawer)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';

import { ANIMATION } from '@/lib/constants/animations';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';

import { LogoutButton } from './LogoutButton';
import { navLinks } from './nav-links';
import { UserAvatar } from './UserAvatar';

interface MobileNavDrawerProps {
  userEmail: string;
}

export function MobileNavDrawer({ userEmail }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const isOpen = useNavigationStore((s) => s.isOpen);
  const close = useNavigationStore((s) => s.close);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Handle link click - close drawer
  const handleLinkClick = useCallback(() => {
    close();
  }, [close]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            data-testid="nav-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={ANIMATION.fade}
            onClick={close}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            data-testid="nav-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={ANIMATION.slideIn}
            className="fixed inset-y-0 left-0 w-72 bg-background border-r border-border z-50 flex flex-col md:hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Menu</h2>
              <button
                type="button"
                onClick={close}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] rounded-md hover:bg-accent/50 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6" />
              </button>
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
                    data-testid={`mobile-${link.testId}`}
                    onClick={handleLinkClick}
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
                data-testid="mobile-nav-user-section"
                className="flex items-center gap-3 px-3 py-2"
              >
                <UserAvatar email={userEmail} />
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {userEmail}
                </span>
              </div>
              <LogoutButton />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
