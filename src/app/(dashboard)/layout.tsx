/**
 * Dashboard layout for protected routes.
 *
 * This layout wraps all protected routes in the (dashboard) route group.
 * Authentication is handled by middleware - this layout provides
 * structural organization and can be extended with shared UI elements
 * (navigation, sidebar, etc.) as the app grows.
 *
 * Note: We don't check auth here because:
 * 1. Middleware already protects all non-public routes (secure-by-default)
 * 2. Individual pages handle their own user data needs
 * 3. Avoiding redundant getUser() calls improves performance
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
