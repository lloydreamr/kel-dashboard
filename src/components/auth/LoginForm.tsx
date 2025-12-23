'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSignInWithOtp } from '@/hooks/auth/useAuth';

import { LoginSkeleton } from './LoginSkeleton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** Pre-filled email for retry after expired link */
  defaultEmail?: string;
  /** Error message from URL query params */
  errorFromUrl?: string;
}

/**
 * Login form component for magic link authentication.
 * Validates email and sends magic link via Supabase Auth.
 */
export function LoginForm({ defaultEmail = '', errorFromUrl }: LoginFormProps) {
  const { signIn, error, isLoading, isSuccess, isError } = useSignInWithOtp();

  // Map URL error codes to user-friendly messages
  const getErrorMessage = (): string | null => {
    if (errorFromUrl === 'expired') return 'Link expired. Request a new one.';
    if (errorFromUrl === 'session_expired') return null; // Handled separately with test ID
    return error;
  };

  const displayError = getErrorMessage();
  const isSessionExpired = errorFromUrl === 'session_expired';

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail },
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const isButtonDisabled = !emailValue || !isValid || isLoading;

  const onSubmit = async (data: LoginFormData) => {
    await signIn(data.email);
  };

  if (isLoading) {
    return <LoginSkeleton />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      data-testid="login-form"
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          autoFocus
          autoComplete="email"
          placeholder="you@example.com"
          data-testid="login-email-input"
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {isSessionExpired && (
        <div
          data-testid="session-expired-message"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          Session expired. Please log in again.
        </div>
      )}

      {(isError || displayError) && (
        <div
          data-testid="login-error"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {displayError}
        </div>
      )}

      {isSuccess && (
        <div
          data-testid="login-success"
          className="rounded-md bg-success/10 p-3 text-sm text-success"
          role="status"
        >
          Check your email for a magic link
        </div>
      )}

      <button
        type="submit"
        disabled={isButtonDisabled}
        data-testid="login-submit"
        className="min-h-[48px] w-full rounded-md bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send Magic Link
      </button>
    </form>
  );
}
