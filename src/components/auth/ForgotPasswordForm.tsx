'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useResetPassword } from '@/hooks/auth/useAuth';

import { LoginSkeleton } from './LoginSkeleton';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  /** Pre-filled email from query params */
  defaultEmail?: string;
  /** Error message from URL query params */
  errorFromUrl?: string;
}

/**
 * Forgot password form component.
 * Requests a password reset email via Supabase Auth.
 */
export function ForgotPasswordForm({ defaultEmail = '', errorFromUrl }: ForgotPasswordFormProps) {
  const { resetPassword, isLoading, isSuccess, isError, error } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const isButtonDisabled = !emailValue || !isValid || isLoading;

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await resetPassword(data.email);
  };

  if (isLoading) {
    return <LoginSkeleton />;
  }

  if (isSuccess) {
    return (
      <div className="space-y-4" data-testid="forgot-password-success">
        <div
          className="rounded-md bg-success/10 p-4 text-sm text-success"
          role="status"
        >
          <p className="font-medium">Check your email</p>
          <p className="mt-1">
            We sent you a password reset link. Click it to set a new password.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center text-sm text-primary hover:underline"
          data-testid="back-to-login-link"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="forgot-password-form"
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
            data-testid="forgot-password-email-input"
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {errorFromUrl === 'expired' && (
          <div
            data-testid="reset-link-expired-message"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            Reset link expired. Please request a new one.
          </div>
        )}

        {isError && error && (
          <div
            data-testid="forgot-password-error"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="forgot-password-submit"
          className="w-full"
        >
          Send Reset Link
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
          data-testid="back-to-login-link"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
