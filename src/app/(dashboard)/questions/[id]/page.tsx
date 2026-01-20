import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { QuestionDetailClient } from './QuestionDetailClient';

interface QuestionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Get test user from cookie (only in PLAYWRIGHT_TEST_MODE).
 * Validates that the session is not expired.
 */
async function getTestUser(): Promise<{ id: string; email: string } | null> {
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
      return {
        id: session.user.id || 'test-user-id',
        email: session.user.email,
      };
    }
  } catch {
    // Invalid JSON, ignore
  }

  return null;
}

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Question detail page - view question and add/edit recommendation.
 * Server component that handles auth and passes IDs to client component.
 */
export default async function QuestionDetailPage({
  params,
}: QuestionDetailPageProps) {
  const { id } = await params;

  // Guard: Redirect invalid IDs (like "new") to questions list
  // This prevents Supabase 400 errors from querying with non-UUID IDs
  if (!UUID_REGEX.test(id)) {
    redirect('/market-intelligence/questions');
  }

  // Check for test user first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = await getTestUser();
  if (testUser) {
    return <QuestionDetailClient questionId={id} />;
  }

  // Regular Supabase auth flow
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  return <QuestionDetailClient questionId={id} />;
}
