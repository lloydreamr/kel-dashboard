import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

/**
 * Reset password page for setting a new password.
 * User arrives here after clicking the password reset email link.
 * Server Component wrapper that passes URL params to client form.
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <main
      data-testid="reset-password-page"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Set New Password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <div className="rounded-lg bg-surface p-8 shadow-sm">
          <ResetPasswordForm errorFromUrl={params.error} />
        </div>
      </div>
    </main>
  );
}
