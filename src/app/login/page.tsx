import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; email?: string }>;
}

/**
 * Login page for magic link authentication.
 * Server Component wrapper that passes URL params to client form.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main
      data-testid="login-page"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Kel Project</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with your email to continue
          </p>
        </div>

        <div className="rounded-lg bg-surface p-8 shadow-sm">
          <LoginForm
            defaultEmail={params.email}
            errorFromUrl={params.error}
          />
        </div>
      </div>
    </main>
  );
}
