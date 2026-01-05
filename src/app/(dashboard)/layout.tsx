/**
 * Dashboard Layout
 *
 * Protected layout with navigation sidebar and mobile drawer.
 * Fetches user email server-side and passes to navigation components.
 *
 * Authentication is handled by middleware - this layout provides
 * structural organization and navigation UI.
 */

import { cookies } from 'next/headers';

import { Sidebar, MobileNav } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';

/**
 * Get user email from session (handles both real auth and test mode).
 */
async function getUserEmail(): Promise<string> {
  // Check for test user first (PLAYWRIGHT_TEST_MODE)
  if (process.env.PLAYWRIGHT_TEST_MODE === 'true') {
    const cookieStore = await cookies();
    const testSession = cookieStore.get('kel-test-session');
    if (testSession?.value) {
      try {
        const session = JSON.parse(testSession.value);
        if (session.is_test_session && session.user?.email) {
          return session.user.email;
        }
      } catch {
        // Fall through to real auth
      }
    }
  }

  // Regular Supabase auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? 'Unknown';
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userEmail = await getUserEmail();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar
        userEmail={userEmail}
        className="hidden md:flex w-64 flex-shrink-0"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Header - hidden on desktop */}
        <MobileNav userEmail={userEmail} className="flex md:hidden" />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
