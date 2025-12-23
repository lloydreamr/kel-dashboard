/**
 * Mock Profile API Route for E2E Testing
 *
 * SECURITY: This route ONLY works when PLAYWRIGHT_TEST_MODE=true.
 * It should NEVER be deployed to production.
 *
 * Returns mock profile data based on the test session cookie.
 * Used by E2E tests to simulate different user roles (Maho/Kel).
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { Profile } from '@/types/database';

/**
 * Mock profile data for E2E tests.
 * Matches the structure of the profiles table.
 */
const MOCK_PROFILES: Record<string, Profile> = {
  'test-maho-e2e-mock': {
    id: 'test-maho-e2e-mock',
    email: 'maho@test.example',
    role: 'maho',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'test-kel-e2e-mock': {
    id: 'test-kel-e2e-mock',
    email: 'kel@test.example',
    role: 'kel',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

/**
 * GET /api/test/mock-profile
 *
 * Returns mock profile data based on the test session.
 * Only available when PLAYWRIGHT_TEST_MODE=true AND not in production.
 */
export async function GET() {
  // Security check: Only allow in test mode AND non-production
  const nodeEnv = process.env.NODE_ENV as string;
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true' || nodeEnv === 'production') {
    return NextResponse.json(
      { error: 'Mock profile only available in test mode' },
      { status: 403 }
    );
  }

  // Get test session from cookie
  const cookieStore = await cookies();
  const testSessionCookie = cookieStore.get('kel-test-session');

  if (!testSessionCookie?.value) {
    return NextResponse.json(
      { error: 'No test session found' },
      { status: 401 }
    );
  }

  try {
    const session = JSON.parse(testSessionCookie.value);

    // Validate test session
    if (!session.is_test_session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Invalid test session' },
        { status: 401 }
      );
    }

    // Get mock profile for user
    const profile = MOCK_PROFILES[session.user.id];

    if (!profile) {
      return NextResponse.json(
        { error: 'Mock profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: 'Invalid session format' },
      { status: 400 }
    );
  }
}
