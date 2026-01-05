/**
 * Authorized Email Validation
 *
 * The Kel dashboard is restricted to two users: Maho and Kel.
 * This module provides client-side email validation for better UX.
 *
 * Note: This is a UX optimization only. Server-side authorization
 * is enforced via Supabase RLS policies.
 */

const AUTHORIZED_EMAIL_PATTERNS = [
  /^maho@/i, // maho@anything.com
  /^kel@/i, // kel@anything.com
];

// Specific authorized emails (for production use)
const AUTHORIZED_EMAILS = [
  'lloydiee2570@gmail.com', // Maho's actual email
];

/**
 * Checks if an email exactly matches an authorized email.
 */
function isExactAuthorizedEmail(email: string): boolean {
  return AUTHORIZED_EMAILS.some(
    (authorized) => authorized.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Checks if an email is authorized to access the dashboard.
 *
 * @param email - The email address to validate
 * @returns true if the email matches an authorized pattern
 *
 * @example
 * isAuthorizedEmail('maho@example.com') // true
 * isAuthorizedEmail('kel@company.org')  // true
 * isAuthorizedEmail('other@test.com')   // false
 */
export function isAuthorizedEmail(email: string): boolean {
  return (
    isExactAuthorizedEmail(email) ||
    AUTHORIZED_EMAIL_PATTERNS.some((pattern) => pattern.test(email))
  );
}
