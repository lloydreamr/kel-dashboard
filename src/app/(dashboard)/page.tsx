import { cookies } from 'next/headers';
import Link from 'next/link';
import { Target } from 'lucide-react';
import { redirect } from 'next/navigation';

import { DashboardQuickStats } from '@/components/dashboard';
import { QueueView } from '@/components/queue';
import { createClient } from '@/lib/supabase/server';

import { logout } from './actions';

import type { Profile } from '@/types/database';

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
 * Dashboard content for Maho.
 * Shows quick stats and navigation to questions.
 */
function MahoDashboardContent({ email }: { email: string }) {
  return (
    <main
      data-testid="dashboard-page"
      className="min-h-screen bg-background px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Welcome back!
            </h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <DashboardQuickStats />

        {/* Quick Actions */}
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/questions"
              data-testid="view-questions-link"
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              View Questions
            </Link>
            <Link
              href="/questions/new"
              data-testid="add-question-link"
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              + Add Question
            </Link>
          </div>
        </div>

        {/* Sign out (subtle) */}
        <div className="mt-12 text-center">
          <form action={logout}>
            <button
              type="submit"
              data-testid="logout-button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

/**
 * Get profile by email from database (server-side).
 */
async function getProfileByEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile by email:', error);
    return null;
  }

  return data;
}

/**
 * Dashboard home page - role-based rendering.
 * - Kel sees the decision queue
 * - Maho sees the standard dashboard
 *
 * Note: Layout already checks auth, but we check again here for:
 * 1. Type safety (user is guaranteed non-null)
 * 2. Race condition protection between layout and page render
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  let email: string;
  let role: 'maho' | 'kel' = 'maho';

  // Check for test user first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = await getTestUser();

  if (testUser) {
    email = testUser.email;
    // Look up role from profiles for test user
    const profile = await getProfileByEmail(supabase, email);
    role = profile?.role ?? 'maho';
  } else {
    // Regular Supabase auth flow
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Explicit null check - defensive against race conditions
    if (!user) {
      redirect('/login');
    }

    email = user.email ?? 'Unknown';
    const profile = await getProfileByEmail(supabase, email);
    role = profile?.role ?? 'maho';
  }

  // Role-based rendering
  if (role === 'kel') {
    return <QueueView />;
  }

  return <MahoDashboardContent email={email} />;
}
