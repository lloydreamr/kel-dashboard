/**
 * Loading skeleton for the login form.
 * Displays during form submission per UX12 requirement.
 */
export function LoginSkeleton() {
  return (
    <div
      data-testid="login-loading"
      className="animate-pulse space-y-4"
      aria-label="Loading..."
    >
      <div className="h-12 rounded-md bg-muted" />
      <div className="h-12 rounded-md bg-muted" />
    </div>
  );
}
