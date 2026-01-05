/**
 * Profile Test Factory
 *
 * Creates mock Profile objects for testing.
 * Used by auth tests and role-based access tests.
 */

import type { Profile } from '@/types/database';

/**
 * Creates a mock Profile with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage (Maho by default)
 * const profile = createMockProfile();
 *
 * @example
 * // Kel profile
 * const kelProfile = createMockProfile({
 *   email: 'kel@example.com',
 *   role: 'kel',
 * });
 */
export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: crypto.randomUUID(),
    email: 'maho@example.com',
    role: 'maho',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock Maho profile.
 * Convenience wrapper for the primary user.
 */
export function createMockMahoProfile(overrides?: Partial<Profile>): Profile {
  return createMockProfile({
    email: 'maho@example.com',
    role: 'maho',
    ...overrides,
  });
}

/**
 * Creates a mock Kel profile.
 * Convenience wrapper for the reviewer user.
 */
export function createMockKelProfile(overrides?: Partial<Profile>): Profile {
  return createMockProfile({
    email: 'kel@example.com',
    role: 'kel',
    ...overrides,
  });
}
