'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useUpdatePassword } from '@/hooks/auth/useAuth';

import { LoginSkeleton } from './LoginSkeleton';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  /** Error message from URL query params */
  errorFromUrl?: string;
}

/**
 * Reset password form component.
 * Allows user to set a new password after clicking the reset link.
 * Requires the user to be authenticated via the recovery token.
 */
export function ResetPasswordForm({ errorFromUrl }: ResetPasswordFormProps) {
  const router = useRouter();
  const { updatePassword, isLoading, isSuccess, isError, error } = useUpdatePassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');
  const isButtonDisabled = !passwordValue || !confirmPasswordValue || !isValid || isLoading;

  const onSubmit = async (data: ResetPasswordFormData) => {
    await updatePassword(data.password);
  };

  // Redirect to login after successful password update
  if (isSuccess) {
    return (
      <div className="space-y-4" data-testid="reset-password-success">
        <div
          className="rounded-md bg-success/10 p-4 text-sm text-success"
          role="status"
        >
          <p className="font-medium">Password updated!</p>
          <p className="mt-1">
            Your password has been changed successfully.
          </p>
        </div>
        <Button
          onClick={() => router.push('/login')}
          className="w-full"
          data-testid="go-to-login-button"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <LoginSkeleton />;
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="reset-password-form"
      >
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
            New Password
          </label>
          <input
            {...register('password')}
            id="password"
            type="password"
            autoFocus
            autoComplete="new-password"
            placeholder="Enter new password"
            data-testid="reset-password-input"
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground"
          >
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            data-testid="reset-password-confirm-input"
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
            data-testid="reset-password-error"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="reset-password-submit"
          className="w-full"
        >
          Update Password
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
