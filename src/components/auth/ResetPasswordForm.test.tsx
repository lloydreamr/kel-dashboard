import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ResetPasswordForm } from './ResetPasswordForm';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useUpdatePassword hook
const mockUpdatePassword = vi.fn();
const mockReset = vi.fn();

vi.mock('@/hooks/auth/useAuth', () => ({
  useUpdatePassword: vi.fn(() => ({
    updatePassword: mockUpdatePassword,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: mockReset,
  })),
}));

// Import after mock to get the mocked version
import { useUpdatePassword } from '@/hooks/auth/useAuth';

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUpdatePassword).mockReturnValue({
      updatePassword: mockUpdatePassword,
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      reset: mockReset,
      status: 'idle',
    });
  });

  it('renders form with password inputs', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-confirm-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-submit')).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByTestId('reset-password-submit')).toBeDisabled();
  });

  it('enables submit button when valid passwords are entered', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByTestId('reset-password-input'), 'password123');
    await user.type(screen.getByTestId('reset-password-confirm-input'), 'password123');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-submit')).toBeEnabled();
    });
  });

  it('shows password length validation error', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByTestId('reset-password-input'), 'short');
    await user.tab(); // Trigger blur for validation

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByTestId('reset-password-input'), 'password123');
    await user.type(screen.getByTestId('reset-password-confirm-input'), 'different456');
    await user.tab(); // Trigger blur for validation

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('calls updatePassword when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByTestId('reset-password-input'), 'password123');
    await user.type(screen.getByTestId('reset-password-confirm-input'), 'password123');
    await user.click(screen.getByTestId('reset-password-submit'));

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('password123');
    });
  });

  it('shows success message when password is updated', () => {
    vi.mocked(useUpdatePassword).mockReturnValue({
      updatePassword: mockUpdatePassword,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      reset: mockReset,
      status: 'success',
    });

    render(<ResetPasswordForm />);
    expect(screen.getByTestId('reset-password-success')).toBeInTheDocument();
    expect(screen.getByText(/password updated/i)).toBeInTheDocument();
    expect(screen.getByTestId('go-to-login-button')).toBeInTheDocument();
  });

  it('navigates to login when Go to Login button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useUpdatePassword).mockReturnValue({
      updatePassword: mockUpdatePassword,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      reset: mockReset,
      status: 'success',
    });

    render(<ResetPasswordForm />);
    await user.click(screen.getByTestId('go-to-login-button'));

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows error message when update fails', () => {
    vi.mocked(useUpdatePassword).mockReturnValue({
      updatePassword: mockUpdatePassword,
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: 'Password update failed',
      reset: mockReset,
      status: 'error',
    });

    render(<ResetPasswordForm />);
    expect(screen.getByTestId('reset-password-error')).toBeInTheDocument();
    expect(screen.getByText('Password update failed')).toBeInTheDocument();
  });

  it('shows expired link message from URL error', () => {
    render(<ResetPasswordForm errorFromUrl="expired" />);
    expect(screen.getByTestId('reset-link-expired-message')).toBeInTheDocument();
    expect(screen.getByText(/reset link expired/i)).toBeInTheDocument();
  });

  it('shows back to login link', () => {
    render(<ResetPasswordForm />);
    const link = screen.getByTestId('back-to-login-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  describe('password visibility toggles', () => {
    it('renders password visibility toggle buttons', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByTestId('password-visibility-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-visibility-toggle')).toBeInTheDocument();
    });

    it('has password inputs hidden by default', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByTestId('reset-password-input')).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('reset-password-confirm-input')).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility independently', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByTestId('reset-password-input');
      const confirmInput = screen.getByTestId('reset-password-confirm-input');
      const passwordToggle = screen.getByTestId('password-visibility-toggle');
      const confirmToggle = screen.getByTestId('confirm-password-visibility-toggle');

      // Toggle only password field
      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(confirmInput).toHaveAttribute('type', 'password');

      // Toggle only confirm field
      await user.click(confirmToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(confirmInput).toHaveAttribute('type', 'text');

      // Toggle password back to hidden
      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('type', 'text');
    });

    it('has correct aria-labels for accessibility', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const passwordToggle = screen.getByTestId('password-visibility-toggle');
      const confirmToggle = screen.getByTestId('confirm-password-visibility-toggle');

      // Initially should say "Show password"
      expect(passwordToggle).toHaveAttribute('aria-label', 'Show password');
      expect(confirmToggle).toHaveAttribute('aria-label', 'Show password');

      // After click should say "Hide password"
      await user.click(passwordToggle);
      expect(passwordToggle).toHaveAttribute('aria-label', 'Hide password');

      await user.click(confirmToggle);
      expect(confirmToggle).toHaveAttribute('aria-label', 'Hide password');
    });
  });
});
