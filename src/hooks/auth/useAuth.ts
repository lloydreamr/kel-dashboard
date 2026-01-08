import { useState, useCallback } from 'react';

import { isAuthorizedEmail } from '@/lib/auth/authorized-emails';
import { createClient } from '@/lib/supabase/client';

type SignInStatus = 'idle' | 'loading' | 'success' | 'error';

interface SignInState {
  status: SignInStatus;
  error: string | null;
}

interface UseSignInWithOtpReturn {
  /** Current status of the sign-in operation */
  status: SignInStatus;
  /** Error message if sign-in failed */
  error: string | null;
  /** Whether the form is currently submitting */
  isLoading: boolean;
  /** Whether sign-in was successful */
  isSuccess: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Initiate magic link sign-in */
  signIn: (email: string) => Promise<void>;
  /** Reset state to idle */
  reset: () => void;
}

/**
 * Hook for magic link authentication via Supabase.
 *
 * Handles:
 * - Authorized email validation (client-side UX check)
 * - Magic link request via signInWithOtp
 * - Loading, success, and error states
 *
 * @example
 * const { signIn, isLoading, error } = useSignInWithOtp();
 * await signIn('maho@example.com');
 */
export function useSignInWithOtp(): UseSignInWithOtpReturn {
  const [state, setState] = useState<SignInState>({
    status: 'idle',
    error: null,
  });

  const signIn = useCallback(async (email: string) => {
    // Check authorization client-side first (better UX)
    if (!isAuthorizedEmail(email)) {
      setState({
        status: 'error',
        error: 'This email is not authorized',
      });
      return;
    }

    setState({ status: 'loading', error: null });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState({ status: 'error', error: error.message });
    } else {
      setState({ status: 'success', error: null });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', error: null });
  }, []);

  return {
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    signIn,
    reset,
  };
}

interface UseSignInWithPasswordReturn {
  /** Current status of the sign-in operation */
  status: SignInStatus;
  /** Error message if sign-in failed */
  error: string | null;
  /** Whether the form is currently submitting */
  isLoading: boolean;
  /** Whether sign-in was successful */
  isSuccess: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Initiate password sign-in */
  signIn: (email: string, password: string) => Promise<void>;
  /** Reset state to idle */
  reset: () => void;
}

/**
 * Hook for password authentication via Supabase.
 *
 * Handles:
 * - Authorized email validation (client-side UX check)
 * - Password sign-in via signInWithPassword
 * - Loading, success, and error states
 *
 * @example
 * const { signIn, isLoading, error } = useSignInWithPassword();
 * await signIn('maho@example.com', 'password123');
 */
export function useSignInWithPassword(): UseSignInWithPasswordReturn {
  const [state, setState] = useState<SignInState>({
    status: 'idle',
    error: null,
  });

  const signIn = useCallback(async (email: string, password: string) => {
    // Check authorization client-side first (better UX)
    if (!isAuthorizedEmail(email)) {
      setState({
        status: 'error',
        error: 'This email is not authorized',
      });
      return;
    }

    setState({ status: 'loading', error: null });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState({ status: 'error', error: error.message });
    } else {
      setState({ status: 'success', error: null });
      // Redirect to dashboard on successful login
      window.location.href = '/';
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', error: null });
  }, []);

  return {
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    signIn,
    reset,
  };
}

interface UseResetPasswordReturn {
  /** Current status of the reset operation */
  status: SignInStatus;
  /** Error message if reset failed */
  error: string | null;
  /** Whether the form is currently submitting */
  isLoading: boolean;
  /** Whether reset email was sent successfully */
  isSuccess: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Request password reset email */
  resetPassword: (email: string) => Promise<void>;
  /** Reset state to idle */
  reset: () => void;
}

/**
 * Hook for password reset via Supabase.
 *
 * Handles:
 * - Authorized email validation (client-side UX check)
 * - Password reset email request via resetPasswordForEmail
 * - Loading, success, and error states
 *
 * @example
 * const { resetPassword, isLoading, isSuccess } = useResetPassword();
 * await resetPassword('maho@example.com');
 */
export function useResetPassword(): UseResetPasswordReturn {
  const [state, setState] = useState<SignInState>({
    status: 'idle',
    error: null,
  });

  const resetPassword = useCallback(async (email: string) => {
    // Check authorization client-side first (better UX)
    if (!isAuthorizedEmail(email)) {
      setState({
        status: 'error',
        error: 'This email is not authorized',
      });
      return;
    }

    setState({ status: 'loading', error: null });

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setState({ status: 'error', error: error.message });
    } else {
      setState({ status: 'success', error: null });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', error: null });
  }, []);

  return {
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    resetPassword,
    reset,
  };
}

interface UseUpdatePasswordReturn {
  /** Current status of the update operation */
  status: SignInStatus;
  /** Error message if update failed */
  error: string | null;
  /** Whether the form is currently submitting */
  isLoading: boolean;
  /** Whether password was updated successfully */
  isSuccess: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Update password to new value */
  updatePassword: (newPassword: string) => Promise<void>;
  /** Reset state to idle */
  reset: () => void;
}

/**
 * Hook for updating password after reset via Supabase.
 *
 * Used on the /reset-password page after clicking the email link.
 * The user must already be authenticated via the recovery token.
 *
 * @example
 * const { updatePassword, isLoading, isSuccess } = useUpdatePassword();
 * await updatePassword('newSecurePassword123');
 */
export function useUpdatePassword(): UseUpdatePasswordReturn {
  const [state, setState] = useState<SignInState>({
    status: 'idle',
    error: null,
  });

  const updatePassword = useCallback(async (newPassword: string) => {
    setState({ status: 'loading', error: null });

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setState({ status: 'error', error: error.message });
    } else {
      setState({ status: 'success', error: null });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', error: null });
  }, []);

  return {
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    updatePassword,
    reset,
  };
}
