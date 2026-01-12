/**
 * Navigation Links Configuration
 *
 * Shared navigation links used by both Sidebar and MobileNavDrawer.
 * Single source of truth for navigation structure.
 */

import {
  Home,
  FileQuestion,
  BarChart3,
  Target,
  TrendingUp,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  testId: string;
}

export const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: Home, testId: 'nav-link-dashboard' },
  {
    href: '/questions',
    label: 'Questions',
    icon: FileQuestion,
    testId: 'nav-link-questions',
  },
  {
    href: '/visualization',
    label: 'Visualization',
    icon: BarChart3,
    testId: 'nav-link-visualization',
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: Target,
    testId: 'nav-link-progress',
  },
  // Story 14.2 TODO: Uncomment when MI dashboard landing is complete
  // {
  //   href: '/market-intelligence',
  //   label: 'Market Intel',
  //   icon: TrendingUp,
  //   testId: 'nav-link-market-intelligence',
  // },
];
