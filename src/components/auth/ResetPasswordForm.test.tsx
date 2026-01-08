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
});
