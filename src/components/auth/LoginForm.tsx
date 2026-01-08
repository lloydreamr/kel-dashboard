'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useSignInWithOtp, useSignInWithPassword } from '@/hooks/auth/useAuth';

import { LoginSkeleton } from './LoginSkeleton';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

type AuthMethod = 'password' | 'magic-link';

interface LoginFormProps {
  /** Pre-filled email for retry after expired link */
  defaultEmail?: string;
  /** Error message from URL query params */
  errorFromUrl?: string;
}

/**
 * Login form component supporting both password and magic link authentication.
 * Validates email and authenticates via Supabase Auth.
 */
export function LoginForm({ defaultEmail = '', errorFromUrl }: LoginFormProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [showPassword, setShowPassword] = useState(false);

  const otpAuth = useSignInWithOtp();
  const passwordAuth = useSignInWithPassword();

  const isLoading = authMethod === 'magic-link' ? otpAuth.isLoading : passwordAuth.isLoading;
  const isSuccess = authMethod === 'magic-link' ? otpAuth.isSuccess : passwordAuth.isSuccess;
  const isError = authMethod === 'magic-link' ? otpAuth.isError : passwordAuth.isError;
  const error = authMethod === 'magic-link' ? otpAuth.error : passwordAuth.error;

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
    defaultValues: { email: defaultEmail, password: '' },
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const isButtonDisabled = authMethod === 'password'
    ? !emailValue || !passwordValue || isLoading
    : !emailValue || !isValid || isLoading;

  const onSubmit = async (data: LoginFormData) => {
    if (authMethod === 'password') {
      await passwordAuth.signIn(data.email, data.password || '');
    } else {
      await otpAuth.signIn(data.email);
    }
  };

  if (isLoading) {
    return <LoginSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Auth method tabs */}
      <div className="flex rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setAuthMethod('password')}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            authMethod === 'password'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="auth-method-password"
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod('magic-link')}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            authMethod === 'magic-link'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="auth-method-magic-link"
        >
          Magic Link
        </button>
      </div>

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

        {authMethod === 'password' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                data-testid="login-password-input"
                className="w-full rounded-md border border-border bg-surface px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="password-visibility-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

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

        {isSuccess && authMethod === 'magic-link' && (
          <div
            data-testid="login-success"
            className="rounded-md bg-success/10 p-3 text-sm text-success"
            role="status"
          >
            Check your email for a magic link
          </div>
        )}

        <Button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="login-submit"
          className="w-full mt-2"
        >
          {authMethod === 'password' ? 'Sign In' : 'Send Magic Link'}
        </Button>
      </form>
    </div>
  );
}
