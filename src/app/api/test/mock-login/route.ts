/**
 * Mock Login API Route for E2E Testing
 *
 * SECURITY: This route ONLY works when PLAYWRIGHT_TEST_MODE=true.
 * It should NEVER be deployed to production.
 *
 * This enables Playwright tests to authenticate with real Supabase users
 * that were pre-created for testing purposes.
 *
 * Supports role parameter for multi-user testing:
 * - /api/test/mock-login?role=maho (default)
 * - /api/test/mock-login?role=kel
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

import type { Database } from '@/types/database';

/**
 * Test user credentials - pre-created in Supabase for E2E testing.
 * These users exist in the database with proper profiles and roles.
 */
const TEST_USERS = {
  maho: {
    email: 'maho@test.kel-dashboard.local',
    password: 'TestPassword123!',
  },
  kel: {
    email: 'kel@test.kel-dashboard.local',
    password: 'TestPassword123!',
  },
};

/**
 * GET /api/test/mock-login
 *
 * Authenticates test users via Supabase and sets session cookies.
 * Only available when PLAYWRIGHT_TEST_MODE=true AND not in production.
 *
 * Query params:
 * - role: 'maho' | 'kel' (default: 'maho')
 */
export async function GET(request: Request) {
  // Security check: Only allow in test mode AND non-production (defense-in-depth)
  const nodeEnv = process.env.NODE_ENV as string;
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true' || nodeEnv === 'production') {
    return NextResponse.json(
      { error: 'Mock login only available in test mode' },
      { status: 403 }
    );
  }

  // Parse role from query params
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role') || 'maho';
  const role = roleParam === 'kel' ? 'kel' : 'maho';

  const testUser = TEST_USERS[role];

  // Create redirect response to dashboard - we'll add cookies to this
  const url = new URL('/', request.url);
  const response = NextResponse.redirect(url);

  // Collect cookies to set
  const cookiesToSet: { name: string; value: string; options: object }[] = [];

  // Create Supabase SSR client with cookie handlers
  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // No existing cookies for fresh login
          return [];
        },
        setAll(cookies) {
          // Collect cookies that Supabase wants to set
          cookiesToSet.push(...cookies);
        },
      },
    }
  );

  // Sign in with email/password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });

  if (error || !data.session) {
    console.error('[Mock Login] Auth error:', error?.message);
    return NextResponse.json(
      { error: `Failed to authenticate test user: ${error?.message ?? 'No session'}` },
      { status: 500 }
    );
  }

  // Set all cookies that Supabase SSR collected
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}
