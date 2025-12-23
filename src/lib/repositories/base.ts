/**
 * Base Repository Utilities
 *
 * Common error handling and utilities for all repositories.
 * Import from this module for consistent error patterns.
 */

import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Repository error codes for consistent handling
 */
export const RepositoryErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION: 'VALIDATION',
  CONFLICT: 'CONFLICT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type RepositoryErrorCode =
  (typeof RepositoryErrorCode)[keyof typeof RepositoryErrorCode];

/**
 * Custom error class for repository operations
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: RepositoryErrorCode,
    public readonly cause?: PostgrestError
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Maps Supabase Postgrest error codes to repository error codes
 */
export function mapPostgrestError(error: PostgrestError): RepositoryError {
  // PGRST116 = no rows returned (not found)
  if (error.code === 'PGRST116') {
    return new RepositoryError(
      'Resource not found',
      RepositoryErrorCode.NOT_FOUND,
      error
    );
  }

  // 42501 = insufficient privilege (RLS violation)
  if (error.code === '42501') {
    return new RepositoryError(
      'Access denied',
      RepositoryErrorCode.UNAUTHORIZED,
      error
    );
  }

  // 23505 = unique violation (conflict)
  if (error.code === '23505') {
    return new RepositoryError(
      'Resource already exists',
      RepositoryErrorCode.CONFLICT,
      error
    );
  }

  // 23514 = check violation (validation)
  if (error.code === '23514') {
    return new RepositoryError(
      'Validation failed: ' + error.message,
      RepositoryErrorCode.VALIDATION,
      error
    );
  }

  // Default: unknown error
  return new RepositoryError(
    error.message || 'An unexpected error occurred',
    RepositoryErrorCode.UNKNOWN,
    error
  );
}

/**
 * Type guard for repository errors
 */
export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return isRepositoryError(error) && error.code === RepositoryErrorCode.NOT_FOUND;
}

/**
 * Check if error is an unauthorized error
 */
export function isUnauthorizedError(error: unknown): boolean {
  return (
    isRepositoryError(error) && error.code === RepositoryErrorCode.UNAUTHORIZED
  );
}
