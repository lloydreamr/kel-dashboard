import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

import type { Database } from '@/types/database';
import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Result of session update containing user and response.
 */
export interface UpdateSessionResult {
  /** Authenticated user, or null if not authenticated */
  user: User | null;
  /** Response with updated cookies for session persistence */
  supabaseResponse: NextResponse;
}

/**
 * Updates and validates the user session for middleware.
 *
 * IMPORTANT: Uses getUser() not getSession() for security.
 * getSession() only reads from storage, getUser() validates with server.
 *
 * @param request - The incoming Next.js request
 * @returns Object containing user (or null) and response with cookies
 *
 * @example
 * // In middleware.ts
 * import { updateSession } from '@/lib/supabase/middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   const { user, supabaseResponse } = await updateSession(request);
 *   if (!user) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *   return supabaseResponse;
 * }
 */
export async function updateSession(
  request: NextRequest
): Promise<UpdateSessionResult> {
  // Start with a fresh response that includes the original request
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First, update request cookies for downstream handlers
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on response for browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() not getSession() for security
  // getSession() only reads from storage and doesn't validate with server
  // getUser() makes a server call to validate the token
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Log auth errors for debugging (server-side only)
  if (error) {
    console.error('[Supabase Auth Error]', {
      message: error.message,
      status: error.status,
      path: request.nextUrl.pathname,
    });
  }

  return { user: error ? null : user, supabaseResponse };
}
