import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { logout } from './actions';

/**
 * Get test user from cookie (only in PLAYWRIGHT_TEST_MODE).
 * Validates that the session is not expired.
 */
async function getTestUser(): Promise<{ email: string } | null> {
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return null;
  }

  const cookieStore = await cookies();
  const testSessionCookie = cookieStore.get('kel-test-session');

  if (!testSessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(testSessionCookie.value);
    // Validate test session: must be flagged, have email, and not be expired
    if (
      session.is_test_session &&
      session.user?.email &&
      session.expires_at > Date.now()
    ) {
      return { email: session.user.email };
    }
  } catch {
    // Invalid JSON, ignore
  }

  return null;
}

/**
 * Dashboard content component.
 * Extracted to allow reuse between test and production auth flows.
 */
function DashboardContent({ email }: { email: string }) {
  return (
    <main
      data-testid="dashboard-page"
      className="flex min-h-screen flex-col items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-3xl">🥜</span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome to Kel Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">Logged in as {email}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Status:</span>{' '}
            Authentication complete
          </p>
          <p>
            <span className="font-medium text-foreground">Next:</span> Strategic
            Questions Core
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            data-testid="logout-button"
            className="min-h-[48px] rounded-md px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

/**
 * Dashboard home page - the main authenticated view.
 * Displays welcome message with user's email.
 *
 * Note: Layout already checks auth, but we check again here for:
 * 1. Type safety (user is guaranteed non-null)
 * 2. Race condition protection between layout and page render
 */
export default async function DashboardPage() {
  // Check for test user first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = await getTestUser();
  if (testUser) {
    return <DashboardContent email={testUser.email} />;
  }

  // Regular Supabase auth flow
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Explicit null check - defensive against race conditions
  if (!user) {
    redirect('/login');
  }

  return <DashboardContent email={user.email ?? 'Unknown'} />;
}
