import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForgotPasswordForm } from './ForgotPasswordForm';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock useResetPassword hook
const mockResetPassword = vi.fn();
const mockReset = vi.fn();

vi.mock('@/hooks/auth/useAuth', () => ({
  useResetPassword: vi.fn(() => ({
    resetPassword: mockResetPassword,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: mockReset,
  })),
}));

// Import after mock to get the mocked version
import { useResetPassword } from '@/hooks/auth/useAuth';

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      reset: mockReset,
      status: 'idle',
    });
  });

  it('renders form with email input', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-password-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-password-submit')).toBeInTheDocument();
  });

  it('pre-fills email from defaultEmail prop', () => {
    render(<ForgotPasswordForm defaultEmail="test@example.com" />);
    expect(screen.getByTestId('forgot-password-email-input')).toHaveValue('test@example.com');
  });

  it('disables submit button when email is empty', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByTestId('forgot-password-submit')).toBeDisabled();
  });

  it('enables submit button when valid email is entered', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByTestId('forgot-password-email-input'), 'test@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('forgot-password-submit')).toBeEnabled();
    });
  });

  it('calls resetPassword when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByTestId('forgot-password-email-input'), 'test@example.com');
    await user.click(screen.getByTestId('forgot-password-submit'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message when reset email is sent', () => {
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      reset: mockReset,
      status: 'success',
    });

    render(<ForgotPasswordForm />);
    expect(screen.getByTestId('forgot-password-success')).toBeInTheDocument();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  it('shows error message when reset fails', () => {
    vi.mocked(useResetPassword).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: 'Something went wrong',
      reset: mockReset,
      status: 'error',
    });

    render(<ForgotPasswordForm />);
    expect(screen.getByTestId('forgot-password-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows expired link message from URL error', () => {
    render(<ForgotPasswordForm errorFromUrl="expired" />);
    expect(screen.getByTestId('reset-link-expired-message')).toBeInTheDocument();
    expect(screen.getByText(/reset link expired/i)).toBeInTheDocument();
  });

  it('shows back to login link', () => {
    render(<ForgotPasswordForm />);
    const link = screen.getByTestId('back-to-login-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('shows email validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByTestId('forgot-password-email-input'), 'invalid-email');
    await user.tab(); // Trigger blur for validation

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });
});
