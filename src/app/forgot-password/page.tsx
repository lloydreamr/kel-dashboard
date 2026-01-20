import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

interface ForgotPasswordPageProps {
  searchParams: Promise<{ email?: string; error?: string }>;
}

/**
 * Forgot password page for requesting a password reset email.
 * Server Component wrapper that passes URL params to client form.
 */
export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <main
      data-testid="forgot-password-page"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-lg bg-surface p-8 shadow-sm">
          <ForgotPasswordForm
            defaultEmail={params.email}
            errorFromUrl={params.error}
          />
        </div>
      </div>
    </main>
  );
}
