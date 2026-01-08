import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LoginForm } from './LoginForm';

// Mock Supabase client with both auth methods
const mockSignInWithOtp = vi.fn();
const mockSignInWithPassword = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });
  });

  describe('rendering', () => {
    it('renders with all required elements', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-submit')).toBeInTheDocument();
      expect(screen.getByTestId('auth-method-password')).toBeInTheDocument();
      expect(screen.getByTestId('auth-method-magic-link')).toBeInTheDocument();
    });

    it('has email input focused on mount', () => {
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      expect(emailInput).toHaveFocus();
    });

    it('defaults to password auth method', () => {
      render(<LoginForm />);

      // Password input should be visible when password auth is selected
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    });

    it('hides password input when magic-link is selected', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByTestId('auth-method-magic-link'));

      expect(screen.queryByTestId('login-password-input')).not.toBeInTheDocument();
    });
  });

  describe('password auth', () => {
    it('has submit button disabled when email and password are empty', () => {
      render(<LoginForm />);

      const submitButton = screen.getByTestId('login-submit');
      expect(submitButton).toBeDisabled();
    });

    it('has submit button disabled when only email is entered', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      await user.type(emailInput, 'maho@example.com');

      const submitButton = screen.getByTestId('login-submit');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when both email and password are entered', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('shows error for unauthorized email without API call', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'unauthorized@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent(
          'not authorized'
        );
      });

      // Should not call Supabase API for unauthorized email
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('calls signInWithPassword for authorized email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'maho@example.com',
            password: 'password123',
          })
        );
      });
    });

    it('shows error message when password API returns error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent(
          'Invalid credentials'
        );
      });
    });

    it('shows loading skeleton during password submission', async () => {
      // Make the API call hang to see loading state
      mockSignInWithPassword.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId('login-email-input');
      const passwordInput = screen.getByTestId('login-password-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-loading')).toBeInTheDocument();
      });
    });
  });

  describe('magic-link auth', () => {
    it('enables submit button when valid email is entered', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('shows error for unauthorized email without API call', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'unauthorized@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent(
          'not authorized'
        );
      });

      // Should not call Supabase API for unauthorized email
      expect(mockSignInWithOtp).not.toHaveBeenCalled();
    });

    it('calls signInWithOtp for authorized email (maho@)', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithOtp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'maho@example.com',
          })
        );
      });
    });

    it('calls signInWithOtp for authorized email (kel@)', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'kel@company.org');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithOtp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'kel@company.org',
          })
        );
      });
    });

    it('shows success message after successful magic-link sign-in', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });

      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toHaveTextContent(
          'Check your email for a magic link'
        );
      });
    });

    it('shows error message when OTP API returns error', async () => {
      mockSignInWithOtp.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });

      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-error')).toHaveTextContent(
          'Rate limit exceeded'
        );
      });
    });

    it('shows loading skeleton during magic-link submission', async () => {
      // Make the API call hang to see loading state
      mockSignInWithOtp.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'maho@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-loading')).toBeInTheDocument();
      });
    });

    it('keeps submit button disabled for invalid email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Switch to magic-link auth
      await user.click(screen.getByTestId('auth-method-magic-link'));

      const emailInput = screen.getByTestId('login-email-input');
      const submitButton = screen.getByTestId('login-submit');

      await user.type(emailInput, 'not-an-email');

      // Button should remain disabled for invalid email format
      expect(submitButton).toBeDisabled();
    });
  });

  describe('URL error handling', () => {
    it('shows expired link message from URL param', () => {
      render(<LoginForm errorFromUrl="expired" />);

      expect(screen.getByTestId('login-error')).toHaveTextContent(
        'Link expired. Request a new one.'
      );
    });

    it('shows session expired message from URL param', () => {
      render(<LoginForm errorFromUrl="session_expired" />);

      expect(screen.getByTestId('session-expired-message')).toHaveTextContent(
        'Session expired. Please log in again.'
      );
    });
  });

  describe('props', () => {
    it('pre-fills email from defaultEmail prop', async () => {
      render(<LoginForm defaultEmail="maho@example.com" />);

      // Wait for form to settle after initial render
      await waitFor(() => {
        const emailInput = screen.getByTestId('login-email-input');
        expect(emailInput).toHaveValue('maho@example.com');
      });
    });
  });

  describe('password visibility toggle', () => {
    it('renders password visibility toggle button', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('password-visibility-toggle')).toBeInTheDocument();
    });

    it('has password input type as password by default', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByTestId('login-password-input');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByTestId('login-password-input');
      const toggleButton = screen.getByTestId('password-visibility-toggle');

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has correct aria-label for accessibility', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const toggleButton = screen.getByTestId('password-visibility-toggle');

      // Initially should say "Show password"
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

      // After click should say "Hide password"
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
    });
  });
});
