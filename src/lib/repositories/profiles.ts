/**
 * Profiles Repository
 *
 * All database operations for user profiles.
 * Uses browser client for client-side operations.
 * RLS ensures users can only access their own profile.
 *
 * TEST MODE: When kel-test-session cookie exists, uses mock profile API
 * instead of Supabase. This enables E2E testing without real auth.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Profile, ProfileUpdate } from '@/types/database';

/**
 * Check if we're in test mode by looking for test session cookie
 */
function isTestMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('kel-test-session=');
}

/**
 * Fetch mock profile from test API
 */
async function getMockProfile(): Promise<Profile | null> {
  try {
    const response = await fetch('/api/test/mock-profile', {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch mock profile');
    }

    return response.json();
  } catch {
    return null;
  }
}

/**
 * Profiles repository - handles all profile CRUD operations
 */
export const profilesRepo = {
  /**
   * Get the current authenticated user's profile
   * RLS automatically filters to only the current user's row
   *
   * In test mode, fetches from mock-profile API instead.
   *
   * @returns Profile or null if not found
   * @throws RepositoryError on database errors
   */
  getCurrent: async (): Promise<Profile | null> => {
    // In test mode, use mock profile API
    if (isTestMode()) {
      return getMockProfile();
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (error) {
      // PGRST116 = no rows returned (user has no profile yet)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw mapPostgrestError(error);
    }

    return data;
  },

  /**
   * Get a profile by ID
   * RLS will block access if not the current user's profile
   *
   * @param id - Profile ID (same as auth user ID)
   * @returns Profile
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<Profile> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Profile not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },

  /**
   * Update the current user's profile
   * Only updates provided fields, preserves others
   *
   * @param updates - Fields to update (cannot change id or email)
   * @returns Updated profile
   * @throws RepositoryError on validation or access errors
   */
  update: async (updates: Omit<ProfileUpdate, 'id' | 'email'>): Promise<Profile> => {
    const supabase = createClient();

    // Get current user to ensure we're updating our own profile
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError(
        'Not authenticated',
        RepositoryErrorCode.UNAUTHORIZED
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Profile not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data;
  },
};

// Type export for consumers
export type { Profile, ProfileUpdate };
