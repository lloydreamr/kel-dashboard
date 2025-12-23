import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Auth callback route handler for magic link verification.
 *
 * Supabase magic links redirect here with:
 * - token_hash: The OTP token hash
 * - type: The OTP type (e.g., 'magiclink')
 * - next: Optional redirect path after auth
 *
 * On success: Redirects to the home page (or `next` param).
 * On failure: Redirects to /login with error=expired.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Successful auth - redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=expired`);
}
