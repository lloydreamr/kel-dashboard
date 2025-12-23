import { NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication.
 * All other routes are protected by default (secure-by-default pattern).
 */
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/auth/confirm',
  '/api/test/mock-login',
];

/**
 * Check if a path matches any public route.
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Validate that a redirect URL is safe (same-origin, relative path only).
 * Prevents open redirect vulnerabilities.
 */
function isValidRedirectPath(path: string): boolean {
  // Must be a relative path starting with /
  if (!path.startsWith('/')) return false;
  // Must not contain protocol indicators (open redirect prevention)
  if (path.includes('://') || path.startsWith('//')) return false;
  // Must not contain encoded slashes that could bypass validation
  if (path.includes('%2F%2F') || path.includes('%2f%2f')) return false;
  return true;
}

/**
 * Check for test session cookie (only valid in PLAYWRIGHT_TEST_MODE).
 * Returns mock user object if valid test session exists and is not expired.
 */
function getTestSessionUser(request: NextRequest): { email: string } | null {
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return null;
  }

  const testSessionCookie = request.cookies.get('kel-test-session');
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
 * Next.js middleware for authentication and session management.
 *
 * Security model: Protected by default (allowlist pattern)
 * - Only routes in PUBLIC_ROUTES are accessible without auth
 * - All other routes require authentication
 * - Redirects authenticated users away from login page
 * - Preserves original URL for post-login redirect (with validation)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for test session first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = getTestSessionUser(request);
  if (testUser) {
    // In test mode with valid test session, allow access to protected routes
    if (isPublicRoute(pathname)) {
      if (pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Regular Supabase auth flow
  const { user, supabaseResponse } = await updateSession(request);

  // Public routes: allow access, but redirect authenticated users to dashboard
  if (isPublicRoute(pathname)) {
    if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  // Protected routes (everything not public): require authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url);

    // Preserve original destination for post-login redirect
    // Validate to prevent open redirect attacks
    if (pathname !== '/' && isValidRedirectPath(pathname)) {
      loginUrl.searchParams.set('next', pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
