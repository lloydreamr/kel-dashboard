import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LoginForm } from './LoginForm';

// Mock Supabase client
const mockSignInWithOtp = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  })),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
  });

  it('renders with all required elements', () => {
    render(<LoginForm />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('has email input focused on mount', () => {
    render(<LoginForm />);

    const emailInput = screen.getByTestId('login-email-input');
    expect(emailInput).toHaveFocus();
  });

  it('has submit button disabled when email is empty', () => {
    render(<LoginForm />);

    const submitButton = screen.getByTestId('login-submit');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when valid email is entered', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

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

  it('shows success message after successful sign-in', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

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

  it('shows error message when API returns error', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

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

  it('shows loading skeleton during submission', async () => {
    // Make the API call hang to see loading state
    mockSignInWithOtp.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByTestId('login-email-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(emailInput, 'maho@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-loading')).toBeInTheDocument();
    });
  });

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

  it('pre-fills email from defaultEmail prop', async () => {
    render(<LoginForm defaultEmail="maho@example.com" />);

    // Wait for form to settle after initial render
    await waitFor(() => {
      const emailInput = screen.getByTestId('login-email-input');
      expect(emailInput).toHaveValue('maho@example.com');
    });
  });

  it('keeps submit button disabled for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByTestId('login-email-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(emailInput, 'not-an-email');

    // Button should remain disabled for invalid email format
    expect(submitButton).toBeDisabled();
  });
});
