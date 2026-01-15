/**
 * Test User Session Helper
 *
 * Shared utility for extracting test user from cookie during E2E tests.
 * Only active when PLAYWRIGHT_TEST_MODE=true.
 *
 * @see Story 17.4: Extracted to avoid duplication across page components
 */

import { cookies } from 'next/headers';

export interface TestUser {
  id: string;
  email: string;
}

/**
 * Get test user from cookie (only in PLAYWRIGHT_TEST_MODE).
 * Validates that the session is not expired.
 *
 * @returns Test user object if valid session exists, null otherwise
 */
export async function getTestUser(): Promise<TestUser | null> {
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
