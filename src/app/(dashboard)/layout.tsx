/**
 * Dashboard Layout
 *
 * Protected layout with navigation sidebar and mobile drawer.
 * Fetches user info server-side and passes to navigation components.
 *
 * Authentication is handled by middleware - this layout provides
 * structural organization and navigation UI.
 *
 * Includes the QuickCapture FAB for Maho to take photos during research.
 */

import { cookies } from 'next/headers';

import { QuickCaptureWidget } from '@/components/capture';
import { Sidebar, MobileNav, DashboardContent } from '@/components/layout';
import { OfflineBanner } from '@/components/offline';
import { createClient } from '@/lib/supabase/server';

interface UserInfo {
  email: string;
  id: string;
}

/**
 * Get user info from session (handles both real auth and test mode).
 */
async function getUserInfo(): Promise<UserInfo> {
  // Check for test user first (PLAYWRIGHT_TEST_MODE)
  if (process.env.PLAYWRIGHT_TEST_MODE === 'true') {
    const cookieStore = await cookies();
    const testSession = cookieStore.get('kel-test-session');
    if (testSession?.value) {
      try {
        const session = JSON.parse(testSession.value);
        if (session.is_test_session && session.user?.email) {
          return {
            email: session.user.email,
            // Use email as ID for test users (consistent with other test patterns)
            id: session.user.id ?? session.user.email,
          };
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
  return {
    email: user?.email ?? 'Unknown',
    id: user?.id ?? '',
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = await getUserInfo();

  return (
    <>
      {/* Offline Banner - fixed at top, full width */}
      <OfflineBanner className="fixed top-0 left-0 right-0 z-50" />

      {/* DashboardContent is a Client Component that handles pitch mode visibility */}
      <DashboardContent
        sidebar={
          <Sidebar
            userEmail={userInfo.email}
            className="hidden md:flex w-64 flex-shrink-0"
          />
        }
        mobileNav={
          <MobileNav userEmail={userInfo.email} className="flex md:hidden" />
        }
      >
        {children}
      </DashboardContent>

      {/* Quick Capture FAB - shown on all dashboard pages */}
      {userInfo.id && <QuickCaptureWidget userId={userInfo.id} />}
    </>
  );
}
