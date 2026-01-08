import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Auth callback route handler for magic link and password reset verification.
 *
 * Supabase auth links redirect here with:
 * - token_hash: The OTP token hash
 * - type: The OTP type (e.g., 'magiclink', 'recovery')
 * - next: Optional redirect path after auth
 *
 * For magic links (type=magiclink):
 * - On success: Redirects to the home page (or `next` param)
 * - On failure: Redirects to /login with error=expired
 *
 * For password reset (type=recovery):
 * - On success: Redirects to /reset-password to set new password
 * - On failure: Redirects to /forgot-password with error=expired
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
      // For password reset (recovery), redirect to reset-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      // For magic link and other types, redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed - redirect based on type
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
  }
  return NextResponse.redirect(`${origin}/login?error=expired`);
}
