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
